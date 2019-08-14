import win32serviceutil

import win32service

import win32event

import servicemanager

from multiprocessing import Process

import time 

from oracle_masters_finnone_push import application



class Service(win32serviceutil.ServiceFramework):

    

    _svc_name_ = "Flask_KYC_WebApp_Service"

    _svc_display_name_ = "Flask_KYC_WebApp_Service"

    _svc_description_ = "Flask KYC WebApp Service"



    def __init__(self, *args):

        super().__init__(*args)



    def SvcStop(self):

        tempflag = False

        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)

        self.process.terminate()

        self.ReportServiceStatus(win32service.SERVICE_STOPPED)



    def SvcDoRun(self):

        self.process = Process(target=self.main)

        self.process.start()

        self.process.run()



    def main(self):

        application.run(host='0.0.0.0')#, port=5000)

        '''while tempflag:

            time.sleep(1)'''



if __name__ == '__main__':

    win32serviceutil.HandleCommandLine(Service)