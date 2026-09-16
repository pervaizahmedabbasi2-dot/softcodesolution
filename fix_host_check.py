import json

with open("frontend/package.json", "r") as f:
    pkg = json.load(f)

pkg["scripts"]["dev"] = "ng serve --host 0.0.0.0 --port 3000 --hmr=false --live-reload=false"

with open("frontend/package.json", "w") as f:
    json.dump(pkg, f, indent=2)
