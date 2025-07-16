from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
CORS(app)

# MongoDB URI (no specific DB to allow dynamic per-user DB selection)
app.config["MONGO_URI"] = "mongodb+srv://gaurav:qweasd147258@cluster0.if4ft.mongodb.net/?retryWrites=true&w=majority"

mongo = PyMongo(app)

try:
    mongo.cx.server_info()
    print("Connected to MongoDB Atlas successfully.")
except Exception as e:
    print("Error connecting to MongoDB:", e)

# IST timezone
IST = timezone(timedelta(hours=5, minutes=30))

@app.route('/upload-location', methods=['POST'])
def upload_location():
    data = request.get_json()

    username = data.get('username')
    if not username:
        return jsonify({"error": "Username is required"}), 400

    if 'latitude' not in data or 'longitude' not in data:
        return jsonify({"error": "Latitude and longitude are required"}), 400

    latitude = data['latitude']
    longitude = data['longitude']
    timestamp = datetime.now(IST).isoformat()
    location_data = {
        "latitude": latitude,
        "longitude": longitude,
        "timestamp": timestamp
    }

    try:
        # Use per-user DB
        user_db = mongo.cx[username]
        result = user_db.locations.insert_one(location_data)

        return jsonify({
            "message": "Location saved successfully",
            "id": str(result.inserted_id)
        }), 201

    except Exception as e:
        print("Error inserting location:", e)
        return jsonify({"error": "Database insertion failed"}), 500

@app.route('/locations', methods=['GET'])
def get_locations():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Username is required as a query parameter"}), 400

    try:
        user_db = mongo.cx[username]
        locations_cursor = user_db.locations.find().sort("timestamp", -1)
        output = []
        for loc in locations_cursor:
            output.append({
                "id": str(loc['_id']),
                "latitude": loc['latitude'],
                "longitude": loc['longitude'],
                "timestamp": loc['timestamp'].isoformat()
            })
        return jsonify(output), 200

    except Exception as e:
        print("Error retrieving locations:", e)
        return jsonify({"error": "Failed to retrieve locations"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
