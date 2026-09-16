import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Replacements for inputs, selects, textareas (handling different variations)
    # The pattern matches: bg-[#F0F2F5] border-none rounded-2xl py-... px/pl/pr-... shadow-[inset_...] outline-none ... hover:shadow-[inset_...]
    
    # We will do more general regex replacements to catch all inset shadows and #F0F2F5
    
    # Replace standard input/select/textarea backgrounds
    content = re.sub(r'bg-\[#F0F2F5\] border-none rounded-2xl(.*?)shadow-\[inset_[^\]]+\] outline-none(.*?)(?:hover:shadow-\[inset_[^\]]+\])? transition-all',
                     r'bg-slate-50 border border-slate-200 rounded-2xl\1focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500\2transition-all font-medium text-slate-900', content)
                     
    # Catch any remaining `bg-[#F0F2F5] ... shadow-[inset_...hover:shadow-[inset...]` combinations
    content = re.sub(r'bg-\[#F0F2F5\] border-none rounded-2xl([^>]*?)shadow-\[inset_[^\]]+\]',
                     r'bg-slate-50 border border-slate-200 rounded-2xl\1', content)

    content = re.sub(r'hover:shadow-\[inset_[^\]]+\]', '', content)
    
    # Fix checkboxes (Remember Me / Terms accepted)
    # 'bg-[#F0F2F5] shadow-[inset_2px_2px_5px_#babecc,inset_-3px_-3px_6px_#ffffff]' -> 'bg-slate-50 border border-slate-200'
    content = content.replace("'bg-[#F0F2F5] shadow-[inset_2px_2px_5px_#babecc,inset_-3px_-3px_6px_#ffffff]'", "'bg-slate-50 border border-slate-200'")

    # Fix generic wrapper in register (line 615)
    content = content.replace("bg-[#F0F2F5] rounded-2xl shadow-[inset_2px_2px_5px_#babecc,inset_-3px_-3px_6px_#ffffff]", "bg-slate-50 border border-slate-200 rounded-2xl")

    # Fix Login Forgot Password popup input (line 170)
    content = content.replace("bg-[#F0F2F5] border-none rounded-2xl py-4 pl-12 pr-5 shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff] outline-none", "bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium")

    with open(filename, 'w') as f:
        f.write(content)

fix_file('frontend/src/app/login/login.component.html')
fix_file('frontend/src/app/register/register.component.html')
