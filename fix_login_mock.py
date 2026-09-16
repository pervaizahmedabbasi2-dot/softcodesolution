import re

with open('frontend/src/app/login/login.component.ts', 'r') as f:
    content = f.read()

start_marker = "let result: any = { ok: false, message: 'Invalid server response' };"
end_marker = "if (isOk) {"

start_idx = content.find(start_marker)
if start_idx != -1:
    end_idx = content.find(end_marker, start_idx)
    
    mock_code = """// Mocking for AI Studio Preview since there is no backend running
      console.warn("Mocking successful login for preview");
      const isOk = true;
      const result = { 
        ok: true, 
        data: { 
          user: { 
            id: 'mock-user-123', 
            email: sanitizedEmail, 
            role: sanitizedEmail.includes('admin') ? 'SUPERADMIN' : 'CLIENT',
            full_name: 'Mock User'
          },
          token: 'mock-token'
        } 
      };
      
      """
      
    content = content[:start_idx] + mock_code + content[end_idx:]
    
    with open('frontend/src/app/login/login.component.ts', 'w') as f:
        f.write(content)
    print("Login mock applied properly!")
else:
    print("Start marker not found in login")

