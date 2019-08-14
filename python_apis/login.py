from flask import Flask, render_template, request, flash, session, redirect, url_for
import math, random
import requests
import json

# Insert into table
def insertOTP(MobileNo, OTP):
    return 1#response

# Get Emp Details
def getEmpDetails(employeeNo):
    try:
        url = "http://172.16.103.44/ADR_API/FEDBANK/6526A91A10D147789A3A3ED75507E27A/Dt_668/FEDBAPI0001/{}"
        params = "type=json" 
        api_response = requests.get(url = url.format(employeeNo), params = params)
        json_obj = json.loads(api_response.text)
        return json_obj
    except Exception as e:
        return 1

# Generate OTP Number
def GenerateOTP():
    digits = "0123456789"
    OTP = ''
    for i in range(6):
        OTP += digits[math.floor(random.random()*10)]
    return OTP

# Send OTP SMS
def callSmsApi(sMobileNo, sMessageBody):
   url = "http://www.smsjust.com/sms/user/urlsms.php"
   params ="username=infinityfincorp&pass=4xZ6@Ur$&senderid=INFINI&dest_mobileno={}&message={}&response=Y" 
   response = requests.post(url, params = params.format(sMobileNo, "Thanks for your interest in availing Loan with Fedfina. OTP is {}. Enter to extract your KYC from NSDL, Ministry of Road Transport and Highways, National Voter Service Portal. Valid only for 10 minutes. T and C Apply".format(sMessageBody)))
   return response


#Verify OTP
#@app.route('/VerifyOTP', methods = ['POST'])
def VerifyOTP():
    try:
        sms_mobile = session["UserDetails"][0]["Mobile No"]
        otp = request.form.get("sOTP")
        print("Form OTp:" + otp)
        print("Session OTp:" + session["ConsentOTP"])
        if otp == session["ConsentOTP"]:
            session["VerifiedOTP"] = "Y"
            session["sMobileNumber"] = sms_mobile
		            
            if session["Department"]:
                return '1'
            return '3' 
        else:
            session["VerifiedOTP"] = null
            session["sMobileNumber"] = null
            return 10;#Invalid OTP

    except Exception as e:
        print(e)
        return "OTP not verified"

def SendOTP(form_empcode):

    # Get Emp Code
    session["LoginId"] = form_empcode

    # Call HRMS API for Emp Code
    empdetails = getEmpDetails(form_empcode)
    if empdetails == 1:
        return "Unable to login with employee code."
    # print Emp code details
    print(empdetails)
    emp_id = empdetails[0]["Employee ID"]
    emp_name = empdetails[0]["Employee Name"]
    sms_mobile = empdetails[0]["Mobile No"]
    session["UserDetails"] = empdetails 
    if empdetails[0]["Department"] == 'AUDIT':
        session["Department"] = 1
    else:
        session["Department"] = ''    
    session["Employee Name"] = empdetails[0]["Employee Name"]
    
    # Generate OTP number
    OTP = GenerateOTP()
    if len(OTP) > 0:
        print('Calling SMS API')

        session["ConsentOTP"] = OTP

        print('OTP Sent {}'.format(OTP))

        # Send OTP SMS to Mobile no
        callSmsApi(sms_mobile, OTP)
        return "OTP has been sent."
