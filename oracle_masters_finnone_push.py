import os
import logging
from logging.handlers import RotatingFileHandler 
import cx_Oracle
from flask import Flask, request, json, render_template, session, send_from_directory, url_for, redirect
import json
import requests
import random
from datetime import datetime
from werkzeug import secure_filename
import pathlib
import datetime
import psycopg2
import pymssql
from psycopg2.extras import NamedTupleCursor
import shutil
import datetime
from login import SendOTP, VerifyOTP, GenerateOTP
from forms import LoginForm

db_user = os.environ.get('DBAAS_USER_NAME', 'FEDFINA_CAS')
db_password = os.environ.get('DBAAS_USER_PASSWORD', 'migration123')
db_connect = os.environ.get('DBAAS_DEFAULT_CONNECT_DESCRIPTOR', "172.16.103.43:1533/PRDLMSDB")
service_port = port=os.environ.get('PORT', '6001')

from flask_cors import CORS, cross_origin

app = Flask(__name__)

app.secret_key = 'development key'
cors = CORS(app)

UPLOAD_FOLDER = 'uploads/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER 

@app.route('/logout', methods = ['GET', 'POST'])
def logout():
    session["VerifiedOTP"] = ''
    session["sMobileNumber"] = ''
    return render_template('login.html')

def logg_create():
    import logging
    logFormatStr = '[%(asctime)s] p%(process)s {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s'
    logging.basicConfig(format = logFormatStr, filename = "global.log", level=logging.DEBUG)
    formatter = logging.Formatter(logFormatStr,'%m-%d %H:%M:%S')
    streamHandler = logging.StreamHandler()
    streamHandler.setFormatter(formatter)
    app.logger.addHandler(streamHandler)
    app.logger.info("Logging is set up.")

@app.route('/', methods = ['GET', 'POST'])
def index():
    form = LoginForm()

    if "VerifiedOTP" in session and session["VerifiedOTP"] =="Y":
        return render_template('index.html')
    else:
        form = LoginForm()
        return render_template('login.html', form = form)

def masters_view_queries(viewname, empcode='', selectedvalue=''):
    select_map = {
        "LOS_CUSTWORK_DTLS_MOBILE" : "select INDUSTRY_TYPE, INDUSTRYDESC from LOS_CUSTWORK_DTLS_MOBILE Group by INDUSTRY_TYPE, INDUSTRYDESC order by INDUSTRYDESC",
        "LOS_BRANCH_CODE_MOBILE" : "select BRANCHCODE, BRANCHDESC from LOS_BRANCH_CODE_MOBILE Group By BRANCHCODE, BRANCHDESC order by BRANCHDESC",
        "BRANCH_CODE_ALL" : "select * from LOS_BRANCH_CODE_MOBILE",
        "LOS_CHANNEL_MOBILE" : "select CHANNELDESC, CHANNEL from LOS_CHANNEL_MOBILE Group By CHANNELDESC, CHANNEL order by CHANNEL",
        "LOS_DSA_MOBILE" : "select DSA,DSANAME FROM LOS_DSA_MOBILE  GROUP BY DSA,DSANAME order by DSANAME",
        "LOS_CONNECTOR_MOBILE" : "select CONNECTOR_CODE, CONNECTOR_NAME FROM LOS_CONNECTOR_MOBILE Group By CONNECTOR_CODE, CONNECTOR_NAME order by CONNECTOR_NAME",
        "LOS_PRODUCT_MOBILE" : "select PRODUCT_DESC, PRODUCT_ID FROM LOS_PRODUCT_MOBILE WHERE PRODUCT_ID IN ('STL', 'HL') Group By PRODUCT_DESC, PRODUCT_ID order by PRODUCT_DESC",
        "LOS_INSPECTOR_MOBILE" : "select * FROM LOS_INSPECTOR_MOBILE where inspectorname like '{}%' order by INSPECTORNAME".format(empcode),
        "LOS_title_MOBILE" : "select TITLE_VAL, TITLE_DESC from LOS_title_MOBILE Group By TITLE_VAL, TITLE_DESC order by TITLE_DESC",
        "LOS_Scheme_MOBILE" : "select SCHEME_DESC, SCHEMEID FROM LOS_Scheme_MOBILE WHERE SCHEME_DESC LIKE 'STL%' OR LIKE 'HL%'  GROUP BY SCHEME_DESC,SCHEMEID order by SCHEME_DESC",
        "LOS_APPLICANTTYPE_MOBILE" : "select VALUE, DESCRIPTION FROM LOS_APPLICANTTYPE_MOBILE Group By VALUE, DESCRIPTION order by DESCRIPTION",
        "LOS_DOCTYPE_MOBILE" : "select VALUE, DESCRIPTION FROM LOS_DOCTYPE_MOBILE Group By VALUE, DESCRIPTION order by DESCRIPTION",
        "LOS_ADDRPRROFDOC_MOBILE" : "select VALUE, DESCRIPTION FROM LOS_ADDRPRROFDOC_MOBILE Group By VALUE, DESCRIPTION order by DESCRIPTION",
        "LOS_ADDRTYPE_MOBILE" : "select VALUE, DESCRIPTION FROM LOS_ADDRTYPE_MOBILE Group By VALUE, DESCRIPTION order by DESCRIPTION",
        "LOS_OWNERSHIPTYPE_MOBILE" : "select VALUE, DESCRIPTION FROM LOS_OWNERSHIPTYPE_MOBILE Group By VALUE, DESCRIPTION order by DESCRIPTION",
        "LOS_COUNTRY_MOBILE" : "select COUNTRYID, COUNTRYNAME FROM LOS_COUNTRY_MOBILE Group By COUNTRYID, COUNTRYNAME order by COUNTRYNAME",
        "LOS_STATE_MOBILE" : "select STATEID, STATEDESC FROM LOS_STATE_MOBILE Group By STATEID, STATEDESC order by STATEDESC",
        "LOS_city_MOBILE" : "select CITYID, CITY_NAME FROM LOS_city_MOBILE Group By CITYID, CITY_NAME order by CITY_NAME",
        "LOS_CUSTPROFILE_MOBILE" : "select CUST_PROFILE_ID, CUST_PROFILE_DESC FROM LOS_CUSTPROFILE_MOBILE Group By CUST_PROFILE_ID, CUST_PROFILE_DESC order by CUST_PROFILE_DESC",
        "LOS_ZIPCODE_MOBILE" : "select PINCODE, PINCODE_DESC FROM LOS_ZIPCODE_MOBILE Group By PINCODE, PINCODE_DESC order by PINCODE_DESC",
        "EMPLOYERTYPE" : "select EMPLOYER_TYPE_ID,EMPLOYER_TYPE FROM LOS_CUSTWORK_DTLS_MOBILE  where EMPLOYER_TYPE is not null Group By EMPLOYER_TYPE_ID,EMPLOYER_TYPE  order by EMPLOYER_TYPE",
        "EMPLOYERNAME" : "select EMPLOYER_ID,EMPLOYER_NAME FROM LOS_CUSTWORK_DTLS_MOBILE  where EMPLOYER_NAME is not null Group By EMPLOYER_ID,EMPLOYER_NAME order by EMPLOYER_NAME",
        "LOS_OWNERSHIP_TYPE_MOBILE" : "select *  FROM LOS_OWNERSHIP_TYPE_MOBILE order by LOS_OWNERSHIP_TYPE_MOBILE",
        "LOS_PROPERTY_TYPE_MOBILE" : "select *  FROM LOS_PROPERTY_TYPE_MOBILE order by LOS_PROPERTY_TYPE_MOBILE",
        "LOS_CUST_DATA_MOBILE" : "select * FROM LOS_CUST_DATA_MOBILE order by LOS_CUST_DATA_MOBILE",
        "LOS_city_MOBILE" : "select CITY_NAME, CITYID FROM LOS_city_MOBILE Group By CITY_NAME, CITYID order by CITYID",
        "LOS_STATE_MOBILE" : "select STATEDESC, STATEID FROM LOS_STATE_MOBILE Group By STATEDESC, STATEID order by STATEID",
        "LOS_OWNERSHIP_TYPE_MOBILE" : "select * FROM LOS_OWNERSHIP_TYPE_MOBILE",
        "ZIPCODE_CITY" : "select CITYID, CITY FROM LOS_ZIPCODE_MOBILE where PINCODE = '{}'".format(selectedvalue),
        "ZIPCODE_STATE" : "select CITYID,STATE_ID FROM LOS_ZIPCODE_MOBILE where PINCODE = '{}'".format(selectedvalue),
        "ZIPCODE" : "select * FROM LOS_ZIPCODE_MOBILE",
        "LOS_PROPERTY_usage_MOBILE" : "select PROP_USAGE_DESC, PROP_USAGE_VAL from LOS_PROPERTY_usage_MOBILE Group By PROP_USAGE_DESC, PROP_USAGE_VAL order by PROP_USAGE_VAL",
        "DEDUPE":"select * from LOS_CUST_DATA_MOBILE where MOBILE = '{}'".format(selectedvalue), 
        "mobile_data":"select * from MOBILE_DATA where LOAN_AGREEMENT_NO  = '{}'".format(selectedvalue) ,
        "post_disbursal_documents_upload":"select sstate,sbranch,nlanid,ncustid,skycdir,sgpcfbdir,sgpcbbdir,sgpcfcdir,sgpcbcdir,sappformdir,sIVRdir,sgrcfdir,sgrcbdir from post_disbursal_documents_upload where nlanid = '{}'".format(selectedvalue)
    }
    print(select_map[viewname])
    return select_map[viewname]
 


def makeDictFactory(cursor):
    columnNames = [d[0] for d in cursor.description]
    def createRow(*args):
        return dict(zip(columnNames, args))
    return createRow

def check_form_key_val(key, variable_flag = '', variable_val = ''):
    if variable_flag:
        if len(variable_val) < 0:
            return '' 
        return variable_val
    form = request.json
    return form.get(key) if form.get(key) else ''



def convert_date_format(key):
    dob = check_form_key_val(key)
    if dob:
        date_only = dob.strip().split('T')
        d = datetime.strptime(date_only[0], '%Y-%m-%d')
        dob = d.strftime('%d-%b-%Y').upper()
    return dob
    
@app.route('/oracle_finnone_masters')
def oracle_finone_masters():
    try:
        viewname = request.args.get("viewname")
        empcode = request.args.get("empcode")
        selectedvalue = request.args.get("selectedvalue")
        if selectedvalue == '003':
            query = masters_view_queries('LOS_DSA_MOBILE')
        elif selectedvalue == '002':
            query = masters_view_queries('LOS_CONNECTOR_MOBILE')
        else:    
            query = masters_view_queries(viewname, empcode, selectedvalue)
    
        connection = cx_Oracle.connect(db_user, db_password, db_connect) 
        cur = connection.cursor()
        cur.execute(query)
        app.logger.debug(query)
        cur.rowfactory = makeDictFactory(cur)
        masters_list = cur.fetchall()
        dsa_masters_list = []
        if viewname in ("ZIPCODE_CITY", "ZIPCODE_STATE"):
            for val in masters_list:
                 formatstr = {'CITY':val[list(val.keys())[0]],'STATE':str(val[list(val.keys())[1]])}
                 return  json.dumps(formatstr)

        if selectedvalue:
            for val in masters_list:
                dsa_masters_list.append({'key':val[list(val.keys())[0]],'value' : val[list(val.keys())[1]]})
            return json.dumps(dsa_masters_list, indent=4, default=str)
        return json.dumps(masters_list, indent=4, sort_keys=True, default=str)
    except (Exception, psycopg2.Error) as error :
        message = "Failed to insert record into mobile table :" + error
        throw_exception(connection, message)
    finally:
        close_connection(connection, cur)

@app.route('/finnone_app_push', methods=['POST'])
def finnone_app_push():
    form = request.json
    fullname = form.get("firstname")
    sp_fullname = fullname.strip().split(' ')
    firstname = middlename = lastname = ''
    if len(sp_fullname) > 2:
        #had 3 words
        firstname = sp_fullname[0]
        middlename = sp_fullname[1]
        lastname = sp_fullname[2]
        
    elif len(sp_fullname) > 1:
        #has 2 words
        firstname = sp_fullname[0]
        middlename = ''
        lastname = sp_fullname[1]
    else:
        firstname = sp_fullname[0]
        middlename = ''
        lastname = ''
        #has 1 word
    salutation = check_form_key_val("title") + ' ' + firstname   
    post_data = {
        "unqRequestId": random.randrange(20, 5000, 5),
        "sourceSystem": "BESPOKE",
        "userId": "cointrive",
        "password": "zqbAx8rZ0LvWMftg38eTatwjEANYAo/6",
        "sourceDetail": {
            "branchCode": check_form_key_val("branchcode"),
            "product": "STL",
            "scheme": "344",
            "applicationFormNo": "MO" + str(random.randrange(20, 5000, 5)),
            "channel": "003",
            "dsa": "21",
            "dealer": "1",
            "channelName": "",
            "reCode": "8",
            "loanAmount": check_form_key_val("loanAmount"),
            "loanTenure": check_form_key_val("loanTenure"),
            "promotion": "",
            "asset": "",
            "assetType": "",
            "assetMake": "",
            "assetModel": "",
            "assetCost": "",
            "field1": "",
            "field2": "",
            "field3": "",
            "field4": "",
            "field5": "",
            "field6": "",
            "field7": "",
            "field8": "",
            "field9": "",
            "field10": "",
            "sourceSystem": "SFDC",
            "losStage": "DE",
            "userid": "FEDA",
            "submitDate": ""
        },
        "documents": [
			{
				"docType": "PAN",
		        "documentPath": "\\10.1.57.149\\cc_views\\HFFL\\FileUpload\\h2_20190329053202039.png"
			},
			{
				"docType": "DOB",
		        "documentPath": "\\10.1.57.149\\cc_views\\HFFL\\FileUpload\\h2_20190329053202039.png"
			}
		],
        "applicantDetail": [
		{
                "applicantType": "P",
                "indcorpFlag": "I",
                "customerID":"",
                "salutation": salutation,
                "existCustFlag": "N",
                "title": check_form_key_val("title"),
                "dobProof": "Y",
                "firstName": firstname,
                "middleName": middlename,
                "lastName": lastname,
                "dateOfBirth": convert_date_format("dob"),
                "natureOfBusniness": "",
                "orgType": "",
                "dateOfIncorporation": "",
                "panCard": check_form_key_val("pancard"),
                "addressProofDocument": "DL",
                "ownershipType": check_form_key_val("ownership"),
                "customerProfile": check_form_key_val("profile"),
                "employerName": check_form_key_val("employerName"),
                "employerType": check_form_key_val("employerType"),
                "industryType": check_form_key_val("industryType"),
                "tradeLicenceNo": "",
                "panNoFlag": "",
                "relation": "",
                "form60": "",
                "passportNo": "",
                "nationalId": "",
                "vechicleOwned": "",
                "IVRs": check_form_key_val("emp_IVRs"),
                "cibilScore": "",
                "maritalStatus": "",
                "gender": "",
                "constitution": "",
                "residentStatus": "",
                "currentWorkingYear": check_form_key_val("currentWorkingYear"),
                "currentWorkingMonth": check_form_key_val("currentWorkingMonth"),
                "totalWorkingYear": check_form_key_val("totalWorkingYear"),
                "totalWorkingMonth": check_form_key_val("totalWorkingMonth"),
                "companyName": check_form_key_val("companyName"),
                "incorporationYear": check_form_key_val("incorporationYear"),
                "currentBusinessYear": check_form_key_val("currentBusinessYear"),
                "currentBusinessMonth": check_form_key_val("currentBusinessMonth"),
                "field1": "",
                "field2": "",
                "field3": "",
                "field4": "",
                "field5": "",
                "field6": "",
                "field7": "",
                "field8": "",
                "field9": "",
                "field10": "",
                "addressDetail": [
                    {
                        "addressType": "CURRES",
                        "address1": check_form_key_val("address1"),
                        "address2": check_form_key_val("address2"),
                        "address3": "",
                        "address4": "",
                        "extensionNo": "",
                        "mobile": check_form_key_val("mobile"),
                        "email": check_form_key_val("email"),
                        "country": check_form_key_val("country"),
                        "state": check_form_key_val("state"),
                        "city": check_form_key_val("city"),
                        "pinCode": check_form_key_val("pincode"),
                        "mailingAddress": "Y",
                        "businessOwnership": check_form_key_val("businessOwnership"),
                        "field1": "",
                        "field2": "",
                        "field3": "",
                        "field4": "",
                        "field5": "",
                        "field6": "",
                        "field7": "",
                        "field8": "",
                        "field9": "",
                        "field10": ""
                    }
                ]
            }
        ],
        "propertyDetail": {
            "propertyType": "NEW",
            "propertySubType": "",
            "propertyUsage": check_form_key_val("propertyUsage"),
            "propertyValue": "",
            "colleteralOwnership": "",
            "finalAppraisedValue": "",
            "propertyAddressType": "",
            "propertyAddress1": "",
            "propertyAddress2": "",
            "propertyCountry": check_form_key_val("propertyCountry"),
            "propertyState": check_form_key_val("propertyState"),
            "propertyCity": check_form_key_val("propertyCity"),
            "propertyPinCode": check_form_key_val("propertyPinCode"),
            "field1": "",
            "field2": "",
            "field3": "",
            "field4": "",
            "field5": "",
            "field6": "",
            "field7": "",
            "field8": "",
            "field9": "",
            "field10": ""
        }
    }

    print(post_data)
    url = "http://172.16.103.42:8080/FinnOneService/rest/host/j/loanSourcingService"
    try:
        headers = {'content-Type':'application/json','user-id':'PRABHAT','accept':'application/json','operation-flag':'C'}
        r = requests.post(url, data=json.dumps(post_data), headers=headers)
        print(r.text)
        print("Done")    
        return "True"

    except Exception as e:
        print(e)

@app.route('/custid_details',methods = ['GET','POST'])
def custid_details():
    try:
        form = request.args
        lanid = form.get("lanid")
        connection = pymssql.connect(server='172.16.103.49', user='READWRITE', password='pass@123', database='Fedfina')
        cur = connection.cursor()
        cur.execute(masters_view_queries('mobile_data', '', lanid))
        masters_list = cur.fetchall()
        for row in  masters_list :
                print("Format str - {}".format(row))
                return  json.dumps({'STATE':row[2],'Branch':row[1],'LANID':row[0], 'CUSTID' : row[3], 'CUSTNAME' : row[4], 'type': 'success', 'message': 'Listed Details for {}'.format(lanid)})
        return json.dumps({'type':'Error', 'message':"LanID not found in our database records."}) 
    except IndexError:
        print("Error in records fetching index")
        return "Error in records fetching index"
    except (Exception, pymssql.Error) as error :
        message =  error
        throw_exception(connection, message)
    finally:
        close_connection(connection, cur)
    
def handle_file(f, dynamic_dir, prefix): 
    filename = secure_filename(f.filename)
    if filename:
        p = pathlib.Path(dynamic_dir)
        p.mkdir(parents=True, exist_ok=True)
        f.save(os.path.join(dynamic_dir + '\\' + prefix + filename)) 
        print('Dynamic Dir: {}'.format(os.path.join(dynamic_dir + '\\' + prefix + filename)))
        print("File '{}' successfully Uploaded".format(filename))
        return dynamic_dir + '\\' + prefix + filename
    return ''

def close_connection(connection, cursor):
    #closing database connection.
    if(connection):
        cursor.close()
        connection.close()
        print("PostgreSQL connection is closed")

def throw_exception(connection, message):
    if(connection):
        print(message)

def insert_disbursal_record(state,branch,lanid,custid,kycdir,gpcfbdir,gpcbbdir,gpcfcdir,gpcbcdir,appformdir,IVRdir,grcfdir,grcbdir):     
    try:
        connection = psycopg2.connect(user="postgres", password="Brain$00", host="127.0.0.1", port="5432", database="AgyeyavadMSELAP_LIVE")
        cursor = connection.cursor() 
        check_lanid_exists_localdb = db_select_disbursal_images(lanid, True)
        print("CHECKING LANID EXISTS" + str(check_lanid_exists_localdb))
        update_columns = ''

            
        if check_lanid_exists_localdb:
        
            if kycdir:
                update_columns += "skycdir='" + kycdir+ "',"
            if gpcfbdir:
                update_columns += "sgpcbbdir='" + gpcfbdir+ "',"
            elif gpcbbdir:
                update_columns += "sgpcbbdir='" + gpcbbdir+ "',"
            elif gpcfcdir:
                update_columns += "sgpcfcdir='" + gpcfcdir+ "',"
            elif gpcbcdir:
                update_columns += "sgpcbcdir='" + gpcbcdir+ "',"
            elif appformdir:
                update_columns += "sappformdir='" + appformdir+ "',"
            elif IVRdir:
                update_columns += "sIVRdir='" + IVRdir+ "',"
            elif grcfdir:
                update_columns += "sgrcfdir='" + grcfdir+ "',"
            elif grcbdir:
                update_columns += "sgrcbdir='" + grcbdir+ "',"

        
            db_update_disbursal_images(lanid, update_columns.rstrip(','))
            return False
        postgres_insert_query = """ INSERT INTO post_disbursal_documents_upload (sstate,sbranch,nlanid,ncustid,skycdir,sgpcfbdir,sgpcbbdir,sgpcfcdir,sgpcbcdir,sappformdir,sIVRdir,sgrcfdir,sgrcbdir) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        record_to_insert = (state,branch,lanid,custid,kycdir,gpcfbdir,gpcbbdir,gpcfcdir,gpcbcdir,appformdir,IVRdir,grcfdir,grcbdir)
        cursor.execute(postgres_insert_query, record_to_insert)
        connection.commit()
        count = cursor.rowcount
        print (count, "Record inserted successfully into mobile table")
        return render_template("index.html")
    except (Exception, psycopg2.Error) as error :
        message = "Failed to insert record into mobile table :" + str(error)
        throw_exception(connection, message)
    finally:
        close_connection(connection, cursor)
        
def db_select_disbursal_images(lanid = '', nonurlreq = False):     
    try:
        form = request.args
        if form.get("lanid_text"):
            lanid = form.get("lanid_text").upper()
        app.logger.debug("LanID request received: {}".format(lanid))    
        if not bool(lanid):
            return json.dumps({'type':'Error', 'message':"LanID not found in our database records."}) 
        connection = psycopg2.connect(user="postgres", password="Brain$00", host="127.0.0.1", port="5432", database="AgyeyavadMSELAP_LIVE")
        query = masters_view_queries("post_disbursal_documents_upload", "", lanid)
        cur = connection.cursor(cursor_factory = NamedTupleCursor)
        cur.execute(query)
        app.logger.debug(query)
        template_data = cur.fetchone()
        if nonurlreq:
            return cur.rowcount
        return render_template('imageviewer.html', masters_list = template_data, lanid = lanid, auditid= session["Department"]) 
    except (Exception, psycopg2.Error) as error :
        message = "Failed to select record into mobile table :" + str(error)
        throw_exception(connection, message)
    finally:
        close_connection(connection, cur)
        
def db_update_disbursal_images(lanid, update_columns):     
    try:
        connection = psycopg2.connect(user="postgres", password="Brain$00", host="127.0.0.1", port="5432", database="AgyeyavadMSELAP_LIVE")
        cursor = connection.cursor()
        query = "UPDATE post_disbursal_documents_upload SET {} WHERE nlanid = '{}'".format(update_columns, lanid)
        print("Update query : {}".format(query))
        cursor.execute(query);
        connection.commit()
        return True
    except (Exception, psycopg2.Error) as error :
        message = "Failed to Update record into mobile table :" + str(error)
        throw_exception(connection, message)
    finally:
        close_connection(connection, cursor)

@app.route('/delete_audit_images',methods = ['GET','POST'])
def delete_audit_images():
    form = request.args
    delete_img_dir = form.get("delete_img_dir") 
    lanid = form.get("lanid") 
    update_columns = "sgpcfbdir='',sgpcbbdir='',sgpcfcdir='',sgpcbcdir='',sappformdir='',sivrdir='',sgrcfdir='',sgrcbdir='',dupdated_date=now()"
    db_update_disbursal_images(lanid, update_columns)
    
    shutil.rmtree(delete_img_dir, ignore_errors=True)
    print("Delete :" + delete_img_dir)
    return json.dumps({'type': 'info', 'message': 'Files are has been deleted for Lan ID : <u>{}</u>'.format(lanid)}) 

@app.route('/select_disbursal_images',methods = ['GET','POST'])
def select_disbursal_images():
    form = LoginForm()

    if "VerifiedOTP" in session and session["VerifiedOTP"] =="Y":
        return db_select_disbursal_images()
    else:
        form = LoginForm()
        return render_template('login.html', form = form)
    

@app.route('/post_disbursal_documents_upload',methods = ['GET','POST'])
def upload_file(): 
    success_msg =lanid= ""
    if request.method =='POST':  
        form = request.form
        custId = form.get("custId_text") 
        state = form.get("state_text") 
        branch = form.get("branch_text") 
        lanid = form.get("lanid_text")
        today = datetime.date.today() 
        folder_types = ('KYC', 'App_form', 'GPCFB', 'GPCBB', 'GPCFC', 'GPCBC', 'GRCF', 'GRCB', 'IVR')
        insert_dirs = {}
        base_dir = 'uploads\\'
        records_count = 0
        for folder in folder_types:
            if folder =='KYC':
                print(' Dir: {}'.format(lanid))
                dynamic_dir = base_dir + "{}\{}\{}\{}".format(state,branch,today,custId)
            else:
                dynamic_dir = base_dir + "{}\{}\{}\{}".format(state,branch,today,lanid)

            files = request.files.getlist('{}[]'.format(folder)) 
            for file in files:
                dynamic_dir = handle_file(file, dynamic_dir, '{}_'.format(folder))
                insert_dirs[folder] = dynamic_dir
                    
        insert_disbursal_record(state,branch,lanid,custId,insert_dirs['KYC'],insert_dirs['GPCFB'],insert_dirs['GPCBB'],insert_dirs['GPCFC'],insert_dirs['GPCBC'],insert_dirs['App_form'],insert_dirs['GRCF'],insert_dirs['GRCB'],insert_dirs['IVR'])
        success_msg = "Files are uploaded successfully."    
    return render_template('index.html', success = success_msg, lanid=lanid)

@app.route('/uploads/<path:filename>')
def uploads_static(filename):
    return send_from_directory(app.root_path + '/uploads/', filename)

#Logout Module
@app.route('/SendOTP', methods = ['POST'])
def SendLoginOTP():
    form_empcode = request.form.get("empcode")
    SendOTP(form_empcode)
    return "OTP has been sent."
    
#Verify OTP
@app.route('/VerifyOTP', methods = ['POST'])
def VerifyLoginOTP():
    return VerifyOTP()
  
    
if __name__ == "__main__":
    logg_create()
    app.run(host='0.0.0.0', port=service_port, debug=True) 


