from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
import os
import uuid
import secrets
import datetime
from functools import wraps

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
      'exp': (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)).replace(microsecond=0),
      'iat': datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0)
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

# ------------------ USERS & LECTURERS (FOR ADMIN PART) ------------------
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

# ------------------ HOMEWORK SUBMISSION ------------------

@app.route("/api/homework/submit", methods=["POST"])
@require_auth()
def submit_homework():
   """Submit or resubmit homework for a course"""
   # Only students can submit homework
   if request.user.get("role") != "student":
      return jsonify({"success": False, "message": "Only students can submit homework"}), 403
   
   username = request.user.get("username")
   
   # Get form data
   course_id = request.form.get("courseId")
   homework_id = request.form.get("homeworkId")
   homework_title = request.form.get("homeworkTitle")
   filename = request.form.get("filename")
   comment = request.form.get("comment", "")
   
   if not all([course_id, homework_id, filename]):
      return jsonify({"success": False, "message": "Missing required fields"}), 400
   
   # Handle file upload (optional for resubmission)
   file = request.files.get("file")
   file_path = None
   file_size = 0
   
   if file and file.filename != "":
      # Save file
      ext = os.path.splitext(file.filename)[1].lower()
      unique_id = uuid.uuid4().hex[:8]
      safe_filename = secure_filename(filename)
      base_name = os.path.splitext(safe_filename)[0]
      stored_filename = f"{base_name}_{unique_id}{ext}"
      
      # Create homework folder for user
      user_folder = os.path.join(
         app.config["UPLOAD_FOLDER"], 
         username, 
         "homework_submissions",
         course_id
      )
      os.makedirs(user_folder, exist_ok=True)
      
      file_path_full = os.path.join(user_folder, stored_filename)
      file.save(file_path_full)
      
      file_size = os.path.getsize(file_path_full)
      file_path = f"/static/uploads/{username}/homework_submissions/{course_id}/{stored_filename}"
   
   # Load courses to find the homework
   courses = load_json(COURSES_FILE)
   course = None
   course_key = None
   
   for key, c in courses.items():
      if c.get("courseid") == course_id:
         course = c
         course_key = key
         break
   
   if not course:
      return jsonify({"success": False, "message": "Course not found"}), 404
   
   # Initialize homework array if not exists
   if "homework" not in course:
      course["homework"] = []
   
   # Find or create the homework entry
   homework = None
   homework_index = None
   
   for idx, hw in enumerate(course["homework"]):
      if hw.get("id") == homework_id or hw.get("title") == homework_title:
         homework = hw
         homework_index = idx
         break
   
   if not homework:
      return jsonify({"success": False, "message": "Homework not found in course"}), 404
   
   # Initialize submissions array if not exists
   if "submissions" not in homework:
      homework["submissions"] = []
   
   # Find existing submission or create new one
   submission = None
   submission_index = None
   
   for idx, sub in enumerate(homework["submissions"]):
      if sub.get("studentUsername") == username:
         submission = sub
         submission_index = idx
         break
   
   current_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
   
   if submission:
      # Resubmission - update existing
      if file_path:
         # Delete old file if exists
         if submission.get("filePath"):
            old_file = os.path.join(
               app.static_folder,
               submission["filePath"].replace("/static/", "")
            )
            if os.path.exists(old_file):
               try:
                  os.remove(old_file)
               except:
                  pass
         
         submission["filePath"] = file_path
         submission["fileSize"] = file_size
      
      submission["filename"] = filename
      submission["comment"] = comment
      submission["submittedAt"] = current_time
      submission["isLate"] = datetime.datetime.now(datetime.timezone.utc) > datetime.datetime.fromisoformat(homework.get("dueDate", current_time).replace('Z', '+00:00'))
   else:
      # New submission
      submission = {
         "studentUsername": username,
         "filename": filename,
         "filePath": file_path,
         "fileSize": file_size,
         "comment": comment,
         "submittedAt": current_time,
         "isLate": datetime.datetime.now(datetime.timezone.utc) > datetime.datetime.fromisoformat(homework.get("dueDate", current_time).replace('Z', '+00:00')),
         "grade": None,
         "feedback": ""
      }
      homework["submissions"].append(submission)
   
   # Update the course with new submission
   if submission_index is not None:
      homework["submissions"][submission_index] = submission
   
   course["homework"][homework_index] = homework
   courses[course_key] = course
   
   # Save courses
   save_json(COURSES_FILE, courses)
   
   # Also update student's homeworkSubmissions record
   students = load_json(STUDENTS_FILE)
   student_key = None
   
   for key, student in students.items():
      if student.get("username") == username:
         student_key = key
         break
   
   if student_key:
      if "homeworkSubmissions" not in students[student_key]:
         students[student_key]["homeworkSubmissions"] = []
      
      # Find or create student's homework record
      student_hw = None
      for hw in students[student_key]["homeworkSubmissions"]:
         if hw.get("courseId") == course_id and hw.get("homeworkId") == homework_id:
            student_hw = hw
            break
      
      if student_hw:
         student_hw["submitted"] = True
         student_hw["submittedAt"] = current_time
      else:
         students[student_key]["homeworkSubmissions"].append({
            "courseId": course_id,
            "homeworkId": homework_id,
            "title": homework_title,
            "submitted": True,
            "submittedAt": current_time,
            "dueDate": homework.get("dueDate")
         })
      
      save_json(STUDENTS_FILE, students)
   
   return jsonify({
      "success": True,
      "message": "Homework submitted successfully",
      "data": {
         "submission": submission,
         "isResubmission": submission_index is not None
      }
   }), 201

# ------------------ HOMEWORK MANAGEMENT (LECTURER) ------------------

@app.route("/api/homework/create", methods=["POST"])
@require_roles("lecturer", "admin")
def create_homework():
   """Create new homework for a course"""
   data = request.json
   course_id = data.get("courseId")
   homework_id = data.get("homeworkId")
   title = data.get("title")
   description = data.get("description", "")
   due_date = data.get("dueDate")
   allowed_file_types = data.get("allowedFileTypes", ".pdf,.docx,.zip")
   max_file_size = data.get("maxFileSize", 10)
   
   if not all([course_id, homework_id, title, due_date]):
      return jsonify({"success": False, "message": "Missing required fields"}), 400
   
   # Load courses
   courses = load_json(COURSES_FILE)
   course = None
   course_key = None
   
   for key, c in courses.items():
      if c.get("courseid") == course_id:
         course = c
         course_key = key
         break
   
   if not course:
      return jsonify({"success": False, "message": "Course not found"}), 404
   
   # Verify lecturer is teaching this course
   username = request.user.get("username")
   role = request.user.get("role")
   
   if role == "lecturer":
      if username not in course.get("members", {}).get("lecturer", []):
         return jsonify({"success": False, "message": "You are not teaching this course"}), 403
   
   # Initialize homework array if not exists
   if "homework" not in course:
      course["homework"] = []
   
   # Create new homework
   new_homework = {
      "id": homework_id,
      "title": title,
      "description": description,
      "dueDate": due_date,
      "allowedFileTypes": allowed_file_types,
      "maxFileSize": max_file_size,
      "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
      "createdBy": username,
      "submissions": []
   }
   
   # Add members as pending submissions
   students = course.get("members", {}).get("students", [])
   for student in students:
      new_homework["submissions"].append({
         "studentUsername": student,
         "filename": None,
         "filePath": None,
         "fileSize": 0,
         "comment": "",
         "submittedAt": None,
         "isLate": False,
         "grade": None,
         "feedback": ""
      })
   
   course["homework"].append(new_homework)
   courses[course_key] = course
   
   # Save courses
   save_json(COURSES_FILE, courses)
   
   return jsonify({
      "success": True,
      "message": "Homework created successfully",
      "data": {"homework": new_homework}
   }), 201


@app.route("/api/homework/update", methods=["POST"])
@require_roles("lecturer", "admin")
def update_homework():
   """Update existing homework"""
   data = request.json
   course_id = data.get("courseId")
   homework_id = data.get("homeworkId")
   title = data.get("title")
   description = data.get("description", "")
   due_date = data.get("dueDate")
   allowed_file_types = data.get("allowedFileTypes", ".pdf,.docx,.zip")
   max_file_size = data.get("maxFileSize", 10)
   
   if not all([course_id, homework_id]):
      return jsonify({"success": False, "message": "Missing required fields"}), 400
   
   # Load courses
   courses = load_json(COURSES_FILE)
   course = None
   course_key = None
   
   for key, c in courses.items():
      if c.get("courseid") == course_id:
         course = c
         course_key = key
         break
   
   if not course:
      return jsonify({"success": False, "message": "Course not found"}), 404
   
   # Verify lecturer is teaching this course
   username = request.user.get("username")
   role = request.user.get("role")
   
   if role == "lecturer":
      if username not in course.get("members", {}).get("lecturer", []):
         return jsonify({"success": False, "message": "You are not teaching this course"}), 403
   
   # Find homework
   if "homework" not in course:
      return jsonify({"success": False, "message": "Homework not found"}), 404
   
   homework = None
   homework_index = None
   
   for idx, hw in enumerate(course["homework"]):
      if hw.get("id") == homework_id:
         homework = hw
         homework_index = idx
         break
   
   if not homework:
      return jsonify({"success": False, "message": "Homework not found"}), 404
   
   # Update homework fields
   if title:
      homework["title"] = title
   if description is not None:
      homework["description"] = description
   if due_date:
      homework["dueDate"] = due_date
   if allowed_file_types:
      homework["allowedFileTypes"] = allowed_file_types
   if max_file_size:
      homework["maxFileSize"] = max_file_size
   
   homework["updatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
   
   # Update in course
   course["homework"][homework_index] = homework
   courses[course_key] = course
   
   # Save courses
   save_json(COURSES_FILE, courses)
   
   return jsonify({
      "success": True,
      "message": "Homework updated successfully",
      "data": {"homework": homework}
   })


@app.route("/api/homework/delete", methods=["DELETE"])
@require_roles("lecturer", "admin")
def delete_homework():
   """Delete homework and all submissions"""
   data = request.json
   course_id = data.get("courseId")
   homework_id = data.get("homeworkId")
   
   if not all([course_id, homework_id]):
      return jsonify({"success": False, "message": "Missing required fields"}), 400
   
   # Load courses
   courses = load_json(COURSES_FILE)
   course = None
   course_key = None
   
   for key, c in courses.items():
      if c.get("courseid") == course_id:
         course = c
         course_key = key
         break
   
   if not course:
      return jsonify({"success": False, "message": "Course not found"}), 404
   
   # Verify lecturer is teaching this course
   username = request.user.get("username")
   role = request.user.get("role")
   
   if role == "lecturer":
      if username not in course.get("members", {}).get("lecturer", []):
         return jsonify({"success": False, "message": "You are not teaching this course"}), 403
   
   # Find homework
   if "homework" not in course:
      return jsonify({"success": False, "message": "Homework not found"}), 404
   
   homework = None
   homework_index = None
   
   for idx, hw in enumerate(course["homework"]):
      if hw.get("id") == homework_id:
         homework = hw
         homework_index = idx
         break
   
   if not homework:
      return jsonify({"success": False, "message": "Homework not found"}), 404
   
   # Delete physical files of all submissions
   for submission in homework.get("submissions", []):
      if submission.get("filePath"):
         file_path = os.path.join(
            app.static_folder,
            submission["filePath"].replace("/static/", "")
         )
         if os.path.exists(file_path):
            try:
               os.remove(file_path)
            except Exception as e:
               print(f"Error deleting file: {e}")
   
   # Remove homework from course
   course["homework"].pop(homework_index)
   courses[course_key] = course
   
   # Save courses
   save_json(COURSES_FILE, courses)
   
   return jsonify({
      "success": True,
      "message": "Homework deleted successfully"
   })
   
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
      "personalFiles": record.get("personalFiles", []),  
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


# ------------------ PERSONAL FILE MANAGEMENT ------------------

ALLOWED_FILE_TYPES = {
   'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt',  # Documents
   'jpg', 'jpeg', 'png',  # Images
   'zip', 'rar',  # Archives
   'mp4', 'mp3'  # Media
}

BLOCKED_FILE_TYPES = {
   'exe', 'bat', 'sh', 'cmd', 'com', 'scr', 'vbs', 'js', 'jar', 
   'app', 'deb', 'rpm', 'msi', 'dmg', 'pkg'
}

MAX_STORAGE_PER_USER = 50 * 1024 * 1024  # 50 MB in bytes

def is_file_allowed(filename):
   """Check if file type is allowed"""
   if not filename or '.' not in filename:
      return False
   ext = filename.rsplit('.', 1)[1].lower()
   if ext in BLOCKED_FILE_TYPES:
      return False
   return ext in ALLOWED_FILE_TYPES

def calculate_user_storage(username, role):
   """Calculate total storage used by user"""
   if role not in ROLE_FILES:
      return 0
   
   user_folder = os.path.join(app.config["UPLOAD_FOLDER"], username, "personal_files")
   if not os.path.exists(user_folder):
      return 0
   
   total_size = 0
   for filename in os.listdir(user_folder):
      file_path = os.path.join(user_folder, filename)
      if os.path.isfile(file_path):
         total_size += os.path.getsize(file_path)
   
   return total_size

@app.route("/api/files/upload/<role>/<username>", methods=["POST"])
@require_auth()
def upload_personal_file(role, username):
   """Upload a personal file for user"""
   if role not in ROLE_FILES:
      return jsonify({"success": False, "message": "Invalid role"}), 400
   
   # Verify token matches username
   if request.user.get("username") != username:
      return jsonify({"success": False, "message": "Unauthorized"}), 403
   
   if "file" not in request.files:
      return jsonify({"success": False, "message": "No file provided"}), 400
   
   file = request.files["file"]
   if file.filename == "":
      return jsonify({"success": False, "message": "No file selected"}), 400
   
   # Check file type
   if not is_file_allowed(file.filename):
      return jsonify({
         "success": False, 
         "message": "File type not allowed or blocked for security reasons"
      }), 400
   
   # Check storage limit
   file_size = len(file.read())
   file.seek(0)  # Reset file pointer
   
   current_storage = calculate_user_storage(username, role)
   if current_storage + file_size > MAX_STORAGE_PER_USER:
      remaining = MAX_STORAGE_PER_USER - current_storage
      return jsonify({
         "success": False,
         "message": f"Storage limit exceeded. You have {remaining / (1024*1024):.2f} MB remaining."
      }), 400
   
   # Save file
   ext = os.path.splitext(file.filename)[1].lower()
   unique_id = uuid.uuid4().hex[:8]
   safe_filename = secure_filename(file.filename)
   base_name = os.path.splitext(safe_filename)[0]
   filename = f"{base_name}_{unique_id}{ext}"
   
   user_folder = os.path.join(app.config["UPLOAD_FOLDER"], username, "personal_files")
   os.makedirs(user_folder, exist_ok=True)
   file_path = os.path.join(user_folder, filename)
   
   file.save(file_path)
   
   # Update user record
   records = load_json(ROLE_FILES[role])
   key_to_update = None
   for key, value in records.items():
      if value.get("username") == username:
         key_to_update = key
         break
   
   if not key_to_update:
      return jsonify({"success": False, "message": "User not found"}), 404
   
   # Add file metadata
   file_metadata = {
      "id": unique_id,
      "filename": safe_filename,
      "storedFilename": filename,
      "size": file_size,
      "uploadedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
      "path": f"/static/uploads/{username}/personal_files/{filename}"
   }
   
   if "personalFiles" not in records[key_to_update]:
      records[key_to_update]["personalFiles"] = []
   
   records[key_to_update]["personalFiles"].append(file_metadata)
   save_json(ROLE_FILES[role], records)
   
   return jsonify({
      "success": True,
      "message": "File uploaded successfully",
      "data": {
         "file": file_metadata,
         "storageUsed": current_storage + file_size,
         "storageLimit": MAX_STORAGE_PER_USER
      }
   }), 201

@app.route("/api/files/delete/<role>/<username>/<file_id>", methods=["DELETE"])
@require_auth()
def delete_personal_file(role, username, file_id):
   """Delete a personal file"""
   if role not in ROLE_FILES:
      return jsonify({"success": False, "message": "Invalid role"}), 400
   
   # Verify token matches username
   if request.user.get("username") != username:
      return jsonify({"success": False, "message": "Unauthorized"}), 403
   
   records = load_json(ROLE_FILES[role])
   key_to_update = None
   for key, value in records.items():
      if value.get("username") == username:
         key_to_update = key
         break
   
   if not key_to_update:
      return jsonify({"success": False, "message": "User not found"}), 404
   
   user_files = records[key_to_update].get("personalFiles", [])
   file_to_delete = None
   file_index = None
   
   for idx, file in enumerate(user_files):
      if file.get("id") == file_id:
         file_to_delete = file
         file_index = idx
         break
   
   if not file_to_delete:
      return jsonify({"success": False, "message": "File not found"}), 404
   
   # Delete physical file
   file_path = os.path.join(
      app.config["UPLOAD_FOLDER"], 
      username, 
      "personal_files", 
      file_to_delete["storedFilename"]
   )
   
   if os.path.exists(file_path):
      os.remove(file_path)
   
   # Update user record
   records[key_to_update]["personalFiles"].pop(file_index)
   save_json(ROLE_FILES[role], records)
   
   current_storage = calculate_user_storage(username, role)
   
   return jsonify({
      "success": True,
      "message": "File deleted successfully",
      "data": {
         "storageUsed": current_storage,
         "storageLimit": MAX_STORAGE_PER_USER
      }
   })

@app.route("/api/files/rename/<role>/<username>/<file_id>", methods=["PUT"])
@require_auth()
def rename_personal_file(role, username, file_id):
   """Rename a personal file"""
   if role not in ROLE_FILES:
      return jsonify({"success": False, "message": "Invalid role"}), 400
   
   # Verify token matches username
   if request.user.get("username") != username:
      return jsonify({"success": False, "message": "Unauthorized"}), 403
   
   data = request.json
   new_filename = data.get("filename")
   
   if not new_filename:
      return jsonify({"success": False, "message": "New filename required"}), 400
   
   # Sanitize new filename
   new_filename = secure_filename(new_filename)
   
   records = load_json(ROLE_FILES[role])
   key_to_update = None
   for key, value in records.items():
      if value.get("username") == username:
         key_to_update = key
         break
   
   if not key_to_update:
      return jsonify({"success": False, "message": "User not found"}), 404
   
   user_files = records[key_to_update].get("personalFiles", [])
   file_to_rename = None
   
   for file in user_files:
      if file.get("id") == file_id:
         file_to_rename = file
         break
   
   if not file_to_rename:
      return jsonify({"success": False, "message": "File not found"}), 404
   
   # Keep the extension from stored filename
   old_stored_filename = file_to_rename["storedFilename"]
   ext = os.path.splitext(old_stored_filename)[1]
   unique_id = file_to_rename["id"]
   
   # Create new stored filename
   base_name = os.path.splitext(new_filename)[0]
   new_stored_filename = f"{base_name}_{unique_id}{ext}"
   
   # Rename physical file
   old_path = os.path.join(
      app.config["UPLOAD_FOLDER"],
      username,
      "personal_files",
      old_stored_filename
   )
   new_path = os.path.join(
      app.config["UPLOAD_FOLDER"],
      username,
      "personal_files",
      new_stored_filename
   )
   
   if os.path.exists(old_path):
      os.rename(old_path, new_path)
   
   # Update metadata
   file_to_rename["filename"] = new_filename
   file_to_rename["storedFilename"] = new_stored_filename
   file_to_rename["path"] = f"/static/uploads/{username}/personal_files/{new_stored_filename}"
   
   save_json(ROLE_FILES[role], records)
   
   return jsonify({
      "success": True,
      "message": "File renamed successfully",
      "data": {"file": file_to_rename}
   })

@app.route("/api/files/storage/<role>/<username>", methods=["GET"])
@require_auth()
def get_storage_info(role, username):
   """Get storage information for user"""
   if role not in ROLE_FILES:
      return jsonify({"success": False, "message": "Invalid role"}), 400
   
   current_storage = calculate_user_storage(username, role)
   
   return jsonify({
      "success": True,
      "data": {
         "storageUsed": current_storage,
         "storageLimit": MAX_STORAGE_PER_USER,
         "storagePercent": (current_storage / MAX_STORAGE_PER_USER) * 100
      }
   })

if __name__ == "__main__":
   app.run(debug=True)
   