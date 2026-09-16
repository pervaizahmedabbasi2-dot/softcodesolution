with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    text = f.read()

text = text.replace("""    } finally {
      this.clientPopupBusy = false;
    clientPopupSecurityComingSoon(action: string): void {""", """    } finally {
      this.clientPopupBusy = false;
    }
  }

  clientPopupSecurityComingSoon(action: string): void {""")

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(text)
