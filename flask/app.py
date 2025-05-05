import cv2
import mediapipe as mp
import numpy as np
import joblib
from tensorflow import keras
import os
import io
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Access-Control-Allow-Origin"],
        "expose_headers": ["Content-Type", "Access-Control-Allow-Origin"],
        "supports_credentials": True
    }
})

# --- Configuration ---
MODEL_SAVE_DIR = "emotion_transformer_model"
MODEL_NAME = "tensorFlow_emotion_classifier_ah.keras"
SCALER_NAME = "landmark_scaler_ah.joblib"
ENCODER_NAME = "label_encoder_ah.joblib"

MODEL_PATH = os.path.join(MODEL_SAVE_DIR, MODEL_NAME)
SCALER_PATH = os.path.join(MODEL_SAVE_DIR, SCALER_NAME)
ENCODER_PATH = os.path.join(MODEL_SAVE_DIR, ENCODER_NAME)

LANDMARK_SUBSET_INDICES = sorted(list(set([
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291,
    78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
    70, 63, 105, 66, 107, 55, 65, 52, 53, 46,
    336, 296, 334, 293, 300, 285, 295, 282, 283, 276,
    33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
    474, 475, 476, 477,
    362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398,
    469, 470, 471, 472,
    1, 4, 5, 6, 197, 195, 94, 323, 98, 327,
    205, 425, 10, 152,
])))

sequence_length = len(LANDMARK_SUBSET_INDICES)
REFINE_LANDMARKS = True

print(f"Expecting {sequence_length} landmarks per face for prediction.")

# --- Global Variables ---
model = None
scaler = None
label_encoder = None
face_mesh = None

def load_resources():
    global model, scaler, label_encoder, face_mesh
    print("Loading model, scaler, and encoder...")
    try:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        if not os.path.exists(SCALER_PATH):
            raise FileNotFoundError(f"Scaler file not found at {SCALER_PATH}")
        if not os.path.exists(ENCODER_PATH):
            raise FileNotFoundError(f"Encoder file not found at {ENCODER_PATH}")

        model = keras.models.load_model(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        label_encoder = joblib.load(ENCODER_PATH)
        print("Loaded model, scaler, and encoder successfully.")
    except Exception as e:
        print(f"Error loading model or preprocessing files: {e}")
        exit()

    print("Initializing MediaPipe Face Mesh...")
    try:
        mp_face_mesh = mp.solutions.face_mesh
        face_mesh = mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=REFINE_LANDMARKS,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )
        print("MediaPipe Face Mesh initialized.")
    except Exception as e:
        print(f"Error initializing MediaPipe Face Mesh: {e}")
        exit()

def predict_emotion(image_bytes):
    global model, scaler, label_encoder, face_mesh

    if not all([model, scaler, label_encoder, face_mesh]):
        return "Error", None, "Model or resources not loaded."

    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return "Error", None, "Could not decode image."

        frame_height, frame_width, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)

        emotion_text = "No Face Detected"
        confidence = None
        error_msg = None

        if results.multi_face_landmarks:
            all_face_landmarks = results.multi_face_landmarks[0].landmark
            landmark_subset_coords = []

            for index in LANDMARK_SUBSET_INDICES:
                if index < len(all_face_landmarks):
                    lm = all_face_landmarks[index]
                    landmark_subset_coords.extend([lm.x, lm.y, lm.z])
                else:
                    error_msg = f"Landmark index {index} out of bounds ({len(all_face_landmarks)} landmarks found)."
                    emotion_text = "Landmark Error"
                    print(error_msg)
                    break

            if error_msg is None:
                expected_coords_count = sequence_length * 3
                if len(landmark_subset_coords) == expected_coords_count:
                    landmark_array = np.array(landmark_subset_coords).reshape(1, -1)
                    scaled_landmarks = scaler.transform(landmark_array)
                    model_input_features = scaled_landmarks.reshape((1, sequence_length, 3))
                    positional_indices = np.arange(sequence_length).reshape(1, -1)

                    prediction = model.predict([model_input_features, positional_indices], verbose=0)

                    predicted_index = np.argmax(prediction[0])
                    confidence = float(np.max(prediction[0]))
                    emotion_text = label_encoder.inverse_transform([predicted_index])[0]
                else:
                    error_msg = f"Coordinate count mismatch. Expected {expected_coords_count}, got {len(landmark_subset_coords)}."
                    emotion_text = "Coord Count Error"
                    print(error_msg)
        else:
            emotion_text = "No Face Detected"

        return emotion_text, confidence, error_msg

    except Exception as e:
        print(f"An error occurred during prediction: {e}")
        return "Prediction Error", None, str(e)

HTML_FORM = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Emotion Classifier</title>
  <style>
    body { font-family: sans-serif; margin: 2em; background-color: #f4f4f4; }
    .container { max-width: 500px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    h1 { text-align: center; color: #333; }
    input[type=file] { display: block; margin-bottom: 10px; }
    input[type=submit] { background-color: #5cb85c; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
    input[type=submit]:hover { background-color: #4cae4c; }
    .result { margin-top: 20px; padding: 15px; background: #e9e9e9; border-radius: 4px; }
  </style>
</head>
<body>
<div class="container">
  <h1>Upload Image for Emotion Classification</h1>
  <form method=post enctype=multipart/form-data action="/predict">
    <input type=file name=file accept="image/*" required>
    <input type=submit value=Upload>
  </form>
  {% if prediction %}
  <div class="result">
    <h2>Prediction Result:</h2>
    <p><strong>Emotion:</strong> {{ prediction.emotion }}</p>
    {% if prediction.confidence is not none %}
    <p><strong>Confidence:</strong> {{ "%.2f"|format(prediction.confidence * 100) }}%</p>
    {% endif %}
    {% if prediction.error %}
    <p><strong>Error:</strong> {{ prediction.error }}</p>
    {% endif %}
  </div>
  {% endif %}
</div>
</body>
</html>
"""

@app.route('/', methods=['GET'])
def index():
    return render_template_string(HTML_FORM)

@app.route('/predict', methods=['POST'])
def handle_prediction():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        try:
            img_bytes = file.read()
            emotion, confidence, error = predict_emotion(img_bytes)

            response_data = {
                "emotion": emotion,
                "confidence": confidence,
                "error": error
            }

            return render_template_string(HTML_FORM, prediction=response_data)

        except Exception as e:
            print(f"Error processing file: {e}")
            return jsonify({"error": f"Failed to process image: {str(e)}"}), 500

    return jsonify({"error": "Invalid file"}), 400

@app.route('/api/emotion', methods=['POST'])
def api_emotion():
    print('Received request at /api/emotion')
    if 'file' not in request.files:
        print('No file part in the request')
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    print(f'Received file: {file.filename}')
    if file.filename == '':
        print('No selected file')
        return jsonify({"error": "No selected file"}), 400

    if file:
        try:
            img_bytes = file.read()
            emotion, confidence, error = predict_emotion(img_bytes)
            print(f'Predicted emotion: {emotion}, confidence: {confidence}, error: {error}')
            response_data = {
                "emotion": emotion,
                "confidence": confidence,
                "error": error
            }
            return jsonify(response_data)
        except Exception as e:
            print(f"Error processing file: {e}")
            return jsonify({"error": f"Failed to process image: {str(e)}"}), 500
    print('Invalid file')
    return jsonify({"error": "Invalid file"}), 400

# --- Main Execution ---
if __name__ == '__main__':
    load_resources()
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)
