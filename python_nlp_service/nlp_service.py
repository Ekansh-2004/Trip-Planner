from flask import Flask, request, jsonify
import spacy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
nlp = spacy.load("en_core_web_sm")

@app.route("/parse", methods=["POST"])
def parse_text():
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400

    doc = nlp(text)
    lower_text = text.lower()

    # --- Detect travel category based on description ---
    category = None
    if any(word in lower_text for word in ["hill station", "mountain", "snow", "cool place", "hills"]):
        category = "hill_station"
    elif any(word in lower_text for word in ["beach", "sea", "coast", "ocean", "shore"]):
        category = "beach"
    elif any(word in lower_text for word in ["temple", "religious", "pilgrimage", "spiritual", "holy"]):
        category = "religious"
    elif any(word in lower_text for word in ["hike", "trek", "adventure", "mountain climbing", "trail"]):
        category = "adventure"
    elif any(word in lower_text for word in ["wildlife", "forest", "national park", "jungle", "nature"]):
        category = "nature"
    elif any(word in lower_text for word in ["fort", "palace", "museum", "heritage", "historical", "monument"]):
        category = "historical"

    # --- Extract any mentioned locations ---
    destinations = [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC"]]
    destination = destinations[0] if destinations else None

    return jsonify({
        "description": text,
        "category": category,
        "destination": destination,
        "entities": [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
    })

if __name__ == "__main__":
    print("NLP Service running on http://localhost:5001/parse")
    app.run(host="0.0.0.0", port=5001)
