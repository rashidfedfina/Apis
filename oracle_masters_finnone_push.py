import os
import cx_Oracle
from flask import Flask, request, json
import json
import urllib.request
import urllib.parse

db_user = os.environ.get('DBAAS_USER_NAME', 'FEDFINA_CAS')
db_password = os.environ.get('DBAAS_USER_PASSWORD', 'migration123')
db_connect = os.environ.get('DBAAS_DEFAULT_CONNECT_DESCRIPTOR', "172.16.103.43:1533/PRDLMSDB")
service_port = port=os.environ.get('PORT', '6000')

application = Flask(__name__)

def masters_view_queries(viewname):
    select_map = {
        "LOS_BRANCH_CODE_MOBILE" : "select BRANCHCODE, BRANCHDESC from LOS_BRANCH_CODE_MOBILE",
        "LOS_CHANNEL_MOBILE" : "select CHANNEL, CHANNELDESC from LOS_CHANNEL_MOBILE",
        "LOS_DSA_MOBILE" : "SELECT DSA, DSANAME FROM LOS_DSA_MOBILE",
        "LOS_CONNECTOR_MOBILE" : "SELECT CONNECTOR_CODE, CONNECTOR_NAME FROM LOS_CONNECTOR_MOBILE",
        "LOS_PRODUCT_MOBILE" : "SELECT PRODUCT_ID, PRODUCT_DESC FROM LOS_PRODUCT_MOBILE",
        "LOS_INSPECTOR_MOBILE" : "SELECT INSPECTORID, INSPECTORNAME FROM LOS_INSPECTOR_MOBILE",
        "LOS_title_MOBILE" : "select TITLE_VAL, TITLE_DESC from LOS_title_MOBILE",
        "LOS_Scheme_MOBILE" : "SELECT SCHEMEID, SCHEME_DESC FROM LOS_Scheme_MOBILE",
        "LOS_APPLICANTTYPE_MOBILE" : "SELECT VALUE, DESCRIPTION FROM LOS_APPLICANTTYPE_MOBILE",
        "LOS_DOCTYPE_MOBILE" : "SELECT VALUE, DESCRIPTION FROM LOS_DOCTYPE_MOBILE",
        "LOS_ADDRPRROFDOC_MOBILE" : "SELECT VALUE, DESCRIPTION FROM LOS_ADDRPRROFDOC_MOBILE",
        "LOS_ADDRTYPE_MOBILE" : "SELECT VALUE, DESCRIPTION FROM LOS_ADDRTYPE_MOBILE",
        "LOS_OWNERSHIPTYPE_MOBILE" : "SELECT VALUE, DESCRIPTION FROM LOS_OWNERSHIPTYPE_MOBILE",
        "LOS_COUNTRY_MOBILE" : "SELECT COUNTRYID, COUNTRYNAME FROM LOS_COUNTRY_MOBILE",
        "LOS_STATE_MOBILE" : "SELECT STATEID, STATEDESC FROM LOS_STATE_MOBILE",
        "LOS_city_MOBILE" : "SELECT CITYID, CITY_NAME FROM LOS_city_MOBILE",
        "LOS_CUSTPROFILE_MOBILE" : "SELECT CUST_PROFILE_ID, CUST_PROFILE_DESC FROM LOS_CUSTPROFILE_MOBILE",
        "LOS_ZIPCODE_MOBILE" : "SELECT PINCODE, PINCODE_DESC FROM LOS_ZIPCODE_MOBILE",
        "LOS_CUSTWORK_DTLS_MOBILE" : "SELECT * FROM LOS_CUSTWORK_DTLS_MOBILE",
        "LOS_OWNERSHIP_TYPE_MOBILE" : "SELECT * FROM LOS_OWNERSHIP_TYPE_MOBILE",
        "LOS_PROPERTY_TYPE_MOBILE" : "SELECT * FROM LOS_PROPERTY_TYPE_MOBILE",
        "LOS_CUST_DATA_MOBILE" : "SELECT * FROM LOS_CUST_DATA_MOBILE",
        "LOS_PROPERTY_usage_MOBILE" : "select * from LOS_PROPERTY_usage_MOBILE"
    }
    return select_map[viewname]

def makeDictFactory(cursor):
    columnNames = [d[0] for d in cursor.description]
    def createRow(*args):
        return dict(zip(columnNames, args))
    return createRow

@application.route('/oracle_finnone_masters')
def oracle_finone_masters():
    viewname = request.args.get("viewname")
    connection = cx_Oracle.connect(db_user, db_password, db_connect)
    cur = connection.cursor()
    cur.execute(masters_view_queries(viewname))
    cur.rowfactory = makeDictFactory(cur)
    masters_list = cur.fetchall()
    return json.dumps(masters_list)

@application.route('/finnone_app_push')
def finone_app_push():
    args = request.args
    post_data = {
        "unqRequestId": args.get("leadid"),
        "sourceSystem": "SFDC",
        "userId": "cointrive",
        "password": "zqbAx8rZ0LvWMftg38eTatwjEANYAo/6",
        "sourceDetail": {
            "branchCode": args.get("branchcode"),
            "product": "LAP",
            "scheme": "344",
            "applicationFormNo": "MO" + args.get("leadid"),
            "channel": "003",
            "dsa": "21",
            "dealer": "1",
            "channelName": "",
            "reCode": "8",
            "loanAmount": args.get("loanAmount"),
            "loanTenure": args.get("loanTenure"),
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
        "applicantDetail": [
		{
                "applicantType": "P",
                "indcorpFlag": "I",
                "salutation": args.get("salutation"),
                "existCustFlag": "N",
                "title": args.get("title"),
                "dobProof": "Y",
                "firstName": args.get("firstname"),
                "middleName": args.get("middlename"),
                "lastName": args.get("lastname"),
                "dateOfBirth": args.get("dob"),
                "natureOfBusniness": "",
                "orgType": "",
                "dateOfIncorporation": "",
                "panCard": args.get("pancard"),
                "addressProofDocument": "DL",
                "ownershipType": args.get("ownership"),
                "customerProfile": args.get("profile"),
                "employerName": args.get("employerName"),
                "employerType": args.get("employerType"),
                "industryType": args.get("industryType"),
                "tradeLicenceNo": "",
                "panNoFlag": "",
                "relation": "",
                "form60": "",
                "passportNo": "",
                "nationalId": "",
                "vechicleOwned": "",
                "others": "",
                "cibilScore": "",
                "maritalStatus": "",
                "gender": "",
                "constitution": "",
                "residentStatus": "",
                "currentWorkingYear": args.get("currentWorkingYear"),
                "currentWorkingMonth": args.get("currentWorkingMonth"),
                "totalWorkingYear": args.get("totalWorkingYear"),
                "totalWorkingMonth": args.get("totalWorkingMonth"),
                "companyName": args.get("companyName"),
                "incorporationYear": args.get("incorporationYear"),
                "currentBusinessYear": args.get("currentBusinessYear"),
                "currentBusinessMonth": args.get("currentBusinessMonth"),
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
                        "address1": args.get("address1"),
                        "address2": args.get("address2"),
                        "address3": "",
                        "address4": "",
                        "extensionNo": "",
                        "mobile": args.get("mobile"),
                        "email": args.get("email"),
                        "country": args.get("country"),
                        "state": args.get("state"),
                        "city": args.get("city"),
                        "pinCode": args.get("pincode"),
                        "mailingAddress": "Y",
                        "businessOwnership": args.get("businessOwnership"),
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
            "propertyUsage": args.get("propertyUsage"),
            "propertyValue": "",
            "colleteralOwnership": "",
            "finalAppraisedValue": "",
            "propertyAddressType": "",
            "propertyAddress1": "",
            "propertyAddress2": "",
            "propertyCountry": args.get("propertyCountry"),
            "propertyState": args.get("propertyState"),
            "propertyCity": args.get("propertyCity"),
            "propertyPinCode": args.get("propertyPinCode"),
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
     
    except Exception as e:
        print(e) 	
if __name__ == "__main__":
    application.run(host='0.0.0.0', port=service_port, debug=True)
