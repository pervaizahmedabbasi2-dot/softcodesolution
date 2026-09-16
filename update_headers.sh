#!/bin/bash
# Extract header
awk '/<header/,/<\/header>/' frontend/src/app/landing-page/hero/hero.component.html > temp_header.html

# For login.component.html
# Let's completely rewrite the basic layout of login to include the top header, and give it pt-20.

cat temp_header.html > new_login.html
cat << 'END_LOGIN' >> new_login.html
<div class="min-h-screen flex bg-white font-sans relative overflow-hidden pt-20">
    <!-- Left Side: Form Area -->
    <div class="w-full lg:w-1/2 flex flex-col relative bg-[#F7F9FC] lg:bg-transparent h-[calc(100vh-5rem)] overflow-y-auto">
        <!-- Background gradient for left side -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent pointer-events-none z-0"></div>

        <!-- Main Form Content -->
        <div class="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 min-h-max">
            <div class="w-full max-w-lg bg-white border border-gray-100 lg:border-transparent rounded-[2.5rem] lg:rounded-none shadow-xl lg:shadow-none p-8 sm:p-10 lg:p-0 animate-in fade-in zoom-in duration-700">
                <!-- Header -->
                <div class="flex flex-col items-center text-center mt-2 lg:mt-0 mb-10">
            <div class="w-24 h-24 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 animate-bounce duration-[3000ms]">
                <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="animate-pulse">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            </div>
            <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase">Login</h1>
            <p class="text-gray-500 mt-2 font-medium max-w-lg text-center">Welcome back! Sign in to access your enterprise business dashboard</p>
        </div>

END_LOGIN

# We append the rest of the form from login.component.html
awk '/<form \[formGroup\]="loginForm"/,0' frontend/src/app/login/login.component.html >> new_login.html

# Overwrite login
cp new_login.html frontend/src/app/login/login.component.html


# For register.component.html
cat temp_header.html > new_register.html
cat << 'END_REG' >> new_register.html
<div class="min-h-screen bg-white flex font-sans relative overflow-hidden pt-20">
    <!-- Left Side: Form Area -->
    <div class="w-full lg:w-1/2 flex flex-col relative bg-[#F7F9FC] lg:bg-transparent h-[calc(100vh-5rem)] overflow-y-auto">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent pointer-events-none z-0"></div>
    
    <!-- Main Form Content -->
    <div class="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 min-h-max">
        <div class="w-full max-w-2xl bg-white border border-gray-100 lg:border-transparent rounded-[2.5rem] lg:rounded-none shadow-xl lg:shadow-none p-8 sm:p-10 lg:p-0 animate-in fade-in zoom-in duration-700">
            <div class="flex flex-col items-center text-center mt-2 lg:mt-0 mb-8 sm:mb-10">
                <div class="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-[2rem] flex items-center justify-center shadow-2xl mb-4 sm:mb-6 animate-bounce duration-[3000ms]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none"
                        stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                        class="animate-pulse">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="16" y1="11" x2="22" y2="11" />
                    </svg>
                </div>
                <h2 class="text-3xl sm:text-4xl font-black text-gray-900 leading-tight uppercase tracking-tight italic">
                    Build Your <br class="sm:hidden" /> Company Profile</h2>
                <p class="text-gray-500 mt-2 sm:mt-3 font-medium text-xs sm:text-sm max-w-sm sm:max-w-md mx-auto">
                    Secure your business with dedicated multi-tenant infrastructure
                </p>
            </div>
END_REG

awk '/<form \[formGroup\]="registerForm"/,0' frontend/src/app/register/register.component.html >> new_register.html

cp new_register.html frontend/src/app/register/register.component.html
rm temp_header.html new_login.html new_register.html
