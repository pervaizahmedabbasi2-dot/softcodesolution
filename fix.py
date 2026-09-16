import json
with open("frontend/angular.json", "r") as f:
    data = json.load(f)

options = data["projects"]["softcode-ui"]["architect"]["build"]["options"]
options["deleteOutputPath"] = False

with open("frontend/angular.json", "w") as f:
    json.dump(data, f, indent=2)
