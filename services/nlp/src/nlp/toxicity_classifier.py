from detoxify import Detoxify
from flask import Flask, Response, app, jsonify, request
import orjson

app = Flask(__name__)

model = Detoxify('unbiased')

def get_tokens(speech: str) -> dict[str, float]:
    results = model.predict(speech)
    return results

@app.route('/detoxify', methods=['POST'])
def home():
    data = request.json
    if (data != None and isinstance(data, dict) and "speech" in data and isinstance(data["speech"], str)):
        tokens = get_tokens(data["speech"])
        return orjson.dumps(tokens, option=orjson.OPT_SERIALIZE_NUMPY)
    return Response("{'reason':'No speech str param in input JSON'}", status=400, mimetype='application/json')

if __name__ == '__main__':
    from waitress import serve
    serve(app, host="0.0.0.0", port=8081)
