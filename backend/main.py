from fastapi import FastAPI
from backend.routers import drawers, cards, checks, health, hardware, auth, admin
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ATB Card Manager")

app.include_router(health.router)
app.include_router(drawers.router)
app.include_router(cards.router)
app.include_router(checks.router)
app.include_router(hardware.router)
app.include_router(auth.router)
app.include_router(admin.router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://[::1]:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/")
def root():
    return {"message": "ATB Card Manager API"}
