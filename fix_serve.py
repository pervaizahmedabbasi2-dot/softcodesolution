import json

with open("frontend/angular.json", "r") as f:
    data = json.load(f)

options = data["projects"]["softcode-ui"]["architect"]["serve"]["options"]
del options["disableHostCheck"]
options["allowedHosts"] = [".run.app", "localhost", "127.0.0.1", "all"]

with open("frontend/angular.json", "w") as f:
    json.dump(data, f, indent=2)
