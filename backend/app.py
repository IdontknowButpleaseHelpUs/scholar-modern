from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
import os
import uuid
import secrets
import datetime
from functools import wraps

PORT = int(os.environ.get("PORT", 5000))

# Just for checking if you download the correct version of jwt lol. It is PyJWT btw.
try:
   import jwt
   from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
except ImportError:
   print("ERROR: PyJWT not installed. Run: pip install PyJWT")
   jwt = None

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(
   app,
   resources={r"/api/*": {"origins": "*"}},
   allow_headers=["Content-Type", "Authorization"],
   supports_credentials=True,
)

# Secret key for JWT
app.config['SECRET_KEY'] = 'secret-key-but-I-dont-use-yet-lol'

COURSES_FILE = "../src/database/courses.json"
STUDENTS_FILE = "../src/database/students.json"
ADMINS_FILE = "../src/database/admins.json"
LECTURERS_FILE = "../src/database/lecturers.json"
UPLOAD_FOLDER = os.path.join(app.static_folder, "uploads")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

ROLE_FILES = {
   "student": STUDENTS_FILE,
   "lecturer": LECTURERS_FILE,
   "admin": ADMINS_FILE,
}

# --- Token store (for simple tokens, JWT doesn't need this) ---
active_tokens = {}
GUEST_TOKEN = "guest_token_secret_n0t_real"

@app.before_request
def handle_options():
   if request.method == "OPTIONS":
      return jsonify({"success": True}), 200

def load_json(filename):
   if os.path.exists(filename):
      with open(filename, "r", encoding="utf-8") as file:
            return json.load(file)
   return {}

def save_json(filename, data):
   with open(filename, "w", encoding="utf-8") as file:
      json.dump(data, file, indent=4, ensure_ascii=False)

def allowed_file(filename):
   return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_jwt_token(username, role):
   """Generate JWT token with expiration"""
   payload = {
      'username': username,
      'role': role,
      'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),  # 24 hour expiry
      'iat': datetime.datetime.utcnow()
   }
   token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
   return token

def decode_jwt_token(token):
   """Decode and verify JWT token"""
   if jwt is None:
      return None
   try:
      payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
      return payload
   except ExpiredSignatureError:
      return None  # Token expired
   except InvalidTokenError:
      return None  # Invalid token

# --- Auth Decorators ---
def require_auth(role=None):
   """Legacy: Keep old auth for single role checks"""
   def decorator(f):
      @wraps(f)
      def wrapper(*args, **kwargs):
            token_header = request.headers.get("Authorization")
            token = extract_token(token_header)
            print("🔒 Incoming token:", token)
            
            if token == GUEST_TOKEN:
               request.user = {"username": "guest", "role": "guest"}
               return f(*args, **kwargs)

            # Try JWT first
            payload = decode_jwt_token(token)
            if payload:
               user = {"username": payload['username'], "role": payload['role']}
               if role and user["role"] != role:
                  return jsonify({"success": False, "message": "Forbidden"}), 403
               request.user = user
               return f(*args, **kwargs)

            # Fallback to simple token store
            if token and token in active_tokens:
               user = active_tokens[token]
               if role and user["role"] != role:
                  return jsonify({"success": False, "message": "Forbidden"}), 403
               request.user = user
               return f(*args, **kwargs)

            return jsonify({"success": False, "message": "Unauthorized"}), 401
      return wrapper
   return decorator

def require_roles(*roles):
   """New: allows multiple roles dynamically"""
   def decorator(f):
      @wraps(f)
      def wrapper(*args, **kwargs):
            token_header = request.headers.get("Authorization")
            token = extract_token(token_header)
            print(" (Debugging) Incoming token:", token)

            if token == GUEST_TOKEN:
               request.user = {"username": "guest", "role": "guest"}
               return f(*args, **kwargs)

            # Try JWT first
            payload = decode_jwt_token(token)
            if payload:
               user = {"username": payload['username'], "role": payload['role']}
               if roles and user["role"] not in roles:
                  return jsonify({"success": False, "message": "Forbidden"}), 403
               request.user = user
               return f(*args, **kwargs)

            # Fallback to simple token store
            if token and token in active_tokens:
               user = active_tokens[token]
               if roles and user["role"] not in roles:
                  return jsonify({"success": False, "message": "Forbidden"}), 403
               request.user = user
               return f(*args, **kwargs)

            return jsonify({"success": False, "message": "Unauthorized"}), 401
      return wrapper
   return decorator

def extract_token(token_header):
   if not token_header:
      return None
   if token_header.startswith("Bearer "):
      return token_header.split(" ", 1)[1]
   return token_header

# ------------------ LOGIN ------------------
@app.route("/api/login", methods=["POST"])
def login():
   data = request.json
   username = data.get("username")
   password = data.get("password")

   # Admins
   admins = load_json(ROLE_FILES["admin"])
   for admin in admins.values():
      if admin["username"] == username and admin["password"] == password:
         token = generate_jwt_token(username, "admin")
         return jsonify({
               "success": True,
               "role": "admin",
               "token": token,
               "name": f"{admin.get('firstName', '')} {admin.get('lastName', '')}".strip(),  
               "adminId": admin.get("adminId"),          
               "joinDate": admin.get("joinDate"),        
               "tasks": admin.get("tasks", []),          
               "message": "Login successful"
         })

   # Lecturers
   lecturers = load_json(ROLE_FILES["lecturer"])
   for lecturer in lecturers.values():
      if lecturer["username"] == username and lecturer["password"] == password:
         token = generate_jwt_token(username, "lecturer")
         return jsonify({
               "success": True,
               "title": lecturer.get("title", ""),
               "role": "lecturer",
               "token": token,
               "name": f"{lecturer.get('firstName', '')} {lecturer.get('lastName', '')}".strip(),
               "firstName": lecturer.get("firstName", ""),
               "lastName": lecturer.get("lastName", ""),
               "courses": lecturer.get("courses", []),
               "lecturerId": lecturer.get("lecturerId"),      
               "joinDate": lecturer.get("joinDate"),          
               "tasks": lecturer.get("tasks", []),            
               "message": "Login successful"
         })

   # Students
   users = load_json(STUDENTS_FILE)
   for user in users.values():
      if user["username"] == username and user["password"] == password:
            token = generate_jwt_token(username, "student")
            return jsonify({
               "success": True,
               "role": "student",
               "token": token,
               "name": f"{user.get('firstName', '')} {user.get('lastName', '')}".strip(),
               "courses": user.get("courses", []),
               "studentId": user.get("studentId"),
               "joinDate": user.get("joinDate"),
               "tasks": user.get("tasks", []),
               "homeworkSubmissions": user.get("homeworkSubmissions", []),
               "message": "Login successful"
            })

   return jsonify({"success": False, "message": "Invalid username or password"}), 401

# ------------------ COURSES ------------------
@app.route("/api/courses", methods=["GET"])
@require_auth()
def get_courses():
   auth_header = request.headers.get("Authorization")
   courses = load_json(COURSES_FILE)
   if auth_header in [GUEST_TOKEN, f"Bearer {GUEST_TOKEN}"]:
      return jsonify({
         "success": True,
         "guest": True,
         "data": list(courses.values()),
         "message": "Courses fetched for guest"
      })
   return jsonify({
      "success": True,
      "data": list(courses.values()),
      "message": "Courses fetched successfully"
   })


@app.route("/api/courses", methods=["POST"])
@require_roles("admin")
def add_course():
   new_course = request.json
   courses = load_json(COURSES_FILE)
   new_id = f"course{len(courses) + 1}"
   courses[new_id] = new_course
   save_json(COURSES_FILE, courses)
   return jsonify({
      "success": True,
      "data": new_course,
      "message": "Course added successfully"
   }), 201


@app.route("/api/courses/<courseid>", methods=["PUT"])
@require_roles("admin")
def update_course(courseid):
   data = request.json
   courses = load_json(COURSES_FILE)
   for cid, course in courses.items():
      if course.get("courseid") == courseid:
            courses[cid].update(data)
            save_json(COURSES_FILE, courses)
            return jsonify({
               "success": True,
               "data": courses[cid],
               "message": "Course updated successfully"
            })
   return jsonify({"success": False, "message": "Course not found"}), 404


@app.route("/api/courses/<courseid>", methods=["DELETE"])
@require_roles("admin")
def delete_course(courseid):
   courses = load_json(COURSES_FILE)
   for cid, course in list(courses.items()):
      if course.get("courseid") == courseid:
            deleted = courses.pop(cid)
            save_json(COURSES_FILE, courses)
            return jsonify({
               "success": True,
               "data": deleted,
               "message": "Course deleted successfully"
            })
   return jsonify({"success": False, "message": "Course not found"}), 404


# ------------------ USERS & LECTURERS ------------------
@app.route("/api/students", methods=["GET"])
@require_roles("admin", "student", "lecturer")
def get_students():
   users = load_json(STUDENTS_FILE)
   return jsonify({
      "success": True,
      "data": users,
      "message": "students fetched successfully"
   })

@app.route("/api/students", methods=["POST"])
@require_roles("admin")
def add_student():
   new_student = request.json
   students = load_json(STUDENTS_FILE)
   
   # Generate new ID
   new_id = str(len(students) + 1)
   students[new_id] = new_student
   
   save_json(STUDENTS_FILE, students)
   return jsonify({
      "success": True,
      "data": new_student,
      "message": "Student added successfully"
   }), 201


@app.route("/api/students/<username>", methods=["PUT"])
@require_roles("admin")
def update_student(username):
   data = request.json
   students = load_json(STUDENTS_FILE)
   
   for sid, student in students.items():
      if student.get("username") == username:
         students[sid].update(data)
         save_json(STUDENTS_FILE, students)
         return jsonify({
            "success": True,
            "data": students[sid],
            "message": "Student updated successfully"
         })
   
   return jsonify({"success": False, "message": "Student not found"}), 404


@app.route("/api/students/<username>", methods=["DELETE"])
@require_roles("admin")
def delete_student(username):
   students = load_json(STUDENTS_FILE)
   
   for sid, student in list(students.items()):
      if student.get("username") == username:
         deleted = students.pop(sid)
         save_json(STUDENTS_FILE, students)
         return jsonify({
            "success": True,
            "data": deleted,
            "message": "Student deleted successfully"
         })
   
   return jsonify({"success": False, "message": "Student not found"}), 404


@app.route("/api/lecturers", methods=["GET"])
@require_auth()
def get_lecturers():
   lecturers = load_json(LECTURERS_FILE)
   return jsonify({
      "success": True,
      "data": list(lecturers.values()),
      "message": "Lecturers fetched successfully"
   })

@app.route("/api/admins", methods=["GET"])
@require_roles("admin")
def get_admins():
   admins = load_json(ADMINS_FILE)
   return jsonify({
      "success": True,
      "data": admins,
      "message": "Admins fetched successfully"
   })
   
@app.route("/api/lecturers", methods=["POST"])
@require_roles("admin")
def add_lecturer():
   new_lecturer = request.json
   lecturers = load_json(LECTURERS_FILE)
   
   # Generate new ID
   new_id = f"lecturer{len(lecturers) + 1}"
   lecturers[new_id] = new_lecturer
   
   save_json(LECTURERS_FILE, lecturers)
   return jsonify({
      "success": True,
      "data": new_lecturer,
      "message": "Lecturer added successfully"
   }), 201


@app.route("/api/lecturers/<username>", methods=["PUT"])
@require_roles("admin")
def update_lecturer(username):
   data = request.json
   lecturers = load_json(LECTURERS_FILE)
   
   for lid, lecturer in lecturers.items():
      if lecturer.get("username") == username:
         lecturers[lid].update(data)
         save_json(LECTURERS_FILE, lecturers)
         return jsonify({
            "success": True,
            "data": lecturers[lid],
            "message": "Lecturer updated successfully"
         })
   
   return jsonify({"success": False, "message": "Lecturer not found"}), 404


@app.route("/api/lecturers/<username>", methods=["DELETE"])
@require_roles("admin")
def delete_lecturer(username):
   lecturers = load_json(LECTURERS_FILE)
   
   for lid, lecturer in list(lecturers.items()):
      if lecturer.get("username") == username:
         deleted = lecturers.pop(lid)
         save_json(LECTURERS_FILE, lecturers)
         return jsonify({
            "success": True,
            "data": deleted,
            "message": "Lecturer deleted successfully"
         })
   
   return jsonify({"success": False, "message": "Lecturer not found"}), 404


# ------------------ PROFILE ------------------
@app.route("/api/<role>/<username>", methods=["GET"])
@require_auth()
def get_profile(role, username):
   if role not in ROLE_FILES:
      return jsonify({"success": False, "message": "Invalid role"}), 400

   data = load_json(ROLE_FILES[role])
   record = None
   for value in data.values():
      if value.get("username") == username:
            record = value
            break

   if not record:
      return jsonify({"success": False, "message": f"{role.capitalize()} not found"}), 404

   safe_data = {
      "username": record.get("username"),
      "firstName": record.get("firstName", ""),
      "lastName": record.get("lastName", ""),
      "title": record.get("title", ""),
      "email": record.get("email", ""),
      "phone": record.get("phone", ""),
      "country": record.get("country", ""),
      "location": record.get("location", ""),
      "description": record.get("description", ""),
      "profilePic": record.get("profilePic", ""),
   }
   return jsonify({
      "success": True,
      "data": safe_data,
      "message": "Profile fetched successfully"
   })


@app.route("/api/<role>/<username>", methods=["POST"])
@require_auth()
def update_profile(role, username):
   if role not in ROLE_FILES:
      return jsonify({"success": False, "message": "Invalid role"}), 400

   records = load_json(ROLE_FILES[role])
   key_to_update = None
   for key, value in records.items():
      if value.get("username") == username:
            key_to_update = key
            break

   if key_to_update:
      records[key_to_update].update(request.json)
      save_json(ROLE_FILES[role], records)
      return jsonify({
         "success": True,
         "message": "Profile updated successfully"
      })

   return jsonify({"success": False, "message": f"{role.capitalize()} not found"}), 404


# ------------------ PROFILE PIC UPLOAD ------------------
@app.route("/api/upload-profile-pic/<role>/<username>", methods=["POST"])
@require_auth()
def upload_profile_pic(role, username):
   if role not in ROLE_FILES:
      return jsonify({"success": False, "message": "Invalid role"}), 400

   if "profilePic" not in request.files:
      return jsonify({"success": False, "message": "No file part"}), 400

   file = request.files["profilePic"]
   if file.filename == "":
      return jsonify({"success": False, "message": "No selected file"}), 400

   if file and allowed_file(file.filename):
      ext = os.path.splitext(file.filename)[1].lower()
      unique_id = uuid.uuid4().hex[:8]
      filename = secure_filename(f"{username}_{unique_id}{ext}")

      # --- Unique folder per user ---
      user_folder = os.path.join(app.config["UPLOAD_FOLDER"], username)
      os.makedirs(user_folder, exist_ok=True)
      file_path = os.path.join(user_folder, filename)

      file.save(file_path)

      records = load_json(ROLE_FILES[role])
      key_to_update = None
      for key, value in records.items():
            if value.get("username") == username:
               key_to_update = key
               break

      if key_to_update:
            records[key_to_update]["profilePic"] = f"/static/uploads/{username}/{filename}"
            save_json(ROLE_FILES[role], records)
            return jsonify({
               "success": True,
               "message": "Profile picture uploaded",
               "data": {"profilePic": f"/static/uploads/{username}/{filename}"}
            })

      return jsonify({"success": False, "message": f"{role.capitalize()} not found"}), 404

   return jsonify({"success": False, "message": "Invalid file type"}), 400


if __name__ == "__main__":
   app.run(host="0.0.0.0", port=PORT, debug=True)