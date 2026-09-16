import json

with open('frontend/angular.json', 'r') as f:
    data = json.load(f)

# Change outputPath.base from "../dist" to "dist"
if "projects" in data and "softcode-ui" in data["projects"]:
    architect = data["projects"]["softcode-ui"].get("architect", {})
    if "build" in architect:
        options = architect["build"].get("options", {})
        if "outputPath" in options and isinstance(options["outputPath"], dict):
            options["outputPath"]["base"] = "dist"

with open('frontend/angular.json', 'w') as f:
    json.dump(data, f, indent=2)
