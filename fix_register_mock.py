import re

with open('frontend/src/app/register/register.component.ts', 'r') as f:
    content = f.read()

start_marker = "// 4. IDX / Browser / Firebase Studio HTTP API."
end_marker = "this.handleSuccess(result);"

start_idx = content.find(start_marker)
if start_idx != -1:
    # Find the end of this.handleSuccess(result);
    end_idx = content.find(end_marker, start_idx) + len(end_marker)
    
    # We will replace this whole chunk with our mock
    mock_code = """// 4. IDX / Browser / Firebase Studio HTTP API.
      // Mocking for AI Studio Preview since there is no backend running
      console.warn("Mocking successful registration for preview");
      const result = {
        ok: true,
        data: {
          user: {
            id: 'mock-user-' + Date.now(),
            email: sanitizedPayload.email,
            role: 'CLIENT',
            full_name: sanitizedPayload.full_name
          },
          token: 'mock-token'
        }
      };
      
      this.handleSuccess(result);"""
      
    content = content[:start_idx] + mock_code + content[end_idx:]
    
    with open('frontend/src/app/register/register.component.ts', 'w') as f:
        f.write(content)
    print("Mock applied properly!")
else:
    print("Start marker not found")

