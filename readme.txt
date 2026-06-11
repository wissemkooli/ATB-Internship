### How to Run the Project

#### 1. Running the Backend (FastAPI)
Open a terminal in the project root directory and run:

**On Windows (PowerShell):**
```powershell
# Activate the virtual environment
.\backend\venv\Scripts\Activate.ps1

# Start the server
uvicorn backend.main:app --reload
```

**On Windows (CMD):**
```cmd
# Activate the virtual environment
backend\venv\Scripts\activate.bat

# Start the server
uvicorn backend.main:app --reload
```

**On macOS/Linux:**
```bash
# Activate the virtual environment
source backend/venv/bin/activate

# Start the server
uvicorn backend.main:app --reload
```

---

#### 2. Running the Frontend (React + Vite)
Open a separate terminal in the project root directory and run:

```bash
# Navigate to the frontend folder
cd frontend

# Start the development server
npm run dev
```