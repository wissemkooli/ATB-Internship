from fastapi import FastAPI
from backend.routers import drawers, cards, health, hardware
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ATB Card Manager")

app.include_router(health.router)
app.include_router(drawers.router)
app.include_router(cards.router)
app.include_router(hardware.router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/")
def root():
    return {"message": "ATB Card Manager API"}