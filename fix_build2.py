import json

with open('frontend/package.json', 'r') as f:
    data = json.load(f)

# Use exactly what we need
data['scripts']['build'] = 'NG_BUILD_MAX_WORKERS=1 ng build'

with open('frontend/package.json', 'w') as f:
    json.dump(data, f, indent=2)
