from flask import Flask, jsonify, render_template, request
import requests

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/weather")
def api_weather():
    city = request.args.get("city", "").strip()
    if not city:
        return jsonify({"error": "City is required."}), 400

    try:
        geo = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": city, "count": 1, "language": "en", "format": "json"},
            timeout=10,
        )
        geo.raise_for_status()
        result = (geo.json().get("results") or [None])[0]
        if not result:
            return jsonify({"error": "City not found."}), 404

        data = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": result["latitude"],
                "longitude": result["longitude"],
                "current": "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max",
                "timezone": "auto",
            },
            timeout=10,
        )
        data.raise_for_status()
        payload = data.json()

        return jsonify(
            {
                "location": f"{result['name']}, {result.get('country', '')}",
                "latitude": result["latitude"],
                "longitude": result["longitude"],
                "timezone": payload.get("timezone", "auto"),
                "current": {
                    "temperature": payload["current"].get("temperature_2m"),
                    "feels_like": payload["current"].get("apparent_temperature"),
                    "wind_speed": payload["current"].get("wind_speed_10m"),
                    "weather_code": payload["current"].get("weather_code"),
                },
                "daily": [
                    {
                        "date": date,
                        "temp_max": payload["daily"]["temperature_2m_max"][idx],
                        "temp_min": payload["daily"]["temperature_2m_min"][idx],
                        "precipitation": payload["daily"]["precipitation_sum"][idx],
                        "uv_index": payload["daily"]["uv_index_max"][idx],
                    }
                    for idx, date in enumerate(payload["daily"]["time"][:5])
                ],
            }
        )
    except requests.RequestException:
        return (
            jsonify({"error": "Cannot reach the weather service. Check your internet or firewall and try again."}),
            502,
        )


if __name__ == "__main__":
    app.run(debug=True)
