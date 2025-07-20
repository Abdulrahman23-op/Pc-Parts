import os
import socket
from flask import Flask, render_template, request, jsonify
from llama_cpp import Llama
import io, sys

# --- Paths & Model Setup ---
HERE = os.path.dirname(__file__)
MODEL_PATH = os.path.join(HERE, 'models', 'llama-2-7b-chat.Q4_K_M.gguf')
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Cannot find model at {MODEL_PATH!r}")

# --- Initialize the Llama model (suppress startup logs) ---
_saved_stdout, _saved_stderr = sys.stdout, sys.stderr
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=2048,
    temperature=0.7,
    verbose=False,
    n_threads=os.cpu_count()
)
# restore stdout/stderr
sys.stdout, sys.stderr = _saved_stdout, _saved_stderr

# --- Flask App Setup ---
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('chat.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    user_msg = data.get('message', '').strip()
    if not user_msg:
        return jsonify(reply='')

    # Wrap for Llama-2-chat
    inst = f"[INST] {user_msg} [/INST]"
    resp = llm(
        prompt=inst,
        max_tokens=256,
        stop=["[/INST]"]
    )
    reply = resp['choices'][0]['text'].strip()
    return jsonify(reply=reply)

if __name__ == '__main__':
    # Force binding to localhost:8080
    host = '127.0.0.1'
    port = 8080
    print(f"Starting server on http://{host}:{port}/")
    app.run(host=host, port=port, debug=True)

