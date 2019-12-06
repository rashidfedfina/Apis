GO

 

/****** Object:  View [dbo].[MOBILE_DATA]    Script Date: 06-12-2019 16:05:12 ******/

SET ANSI_NULLS ON

GO

 

SET QUOTED_IDENTIFIER ON

GO

 

 

 

 

 

 

 

ALTER VIEW [dbo].[MOBILE_DATA]

AS

SELECT 

       LA.LOANACCOUNTNUMBER AS LOAN_AGREEMENT_NO,

          LAP.DateofApplication as TRANSACTION_DATE,

       --LA.APPLICATIONID AS APPLICATION_ID,

       MB.BRANCHNAME AS BRANCH_NAME,

            STA.Description as State_name ,

       C.CUSTOMERCODE AS CUSTOMERID,

       ISNULL(C.CUSTOMERFIRSTNAME,'')+' '+ISNULL(C.CUSTOMERMIDDLENAME,'')+' '+ISNULL(C.CUSTOMERLASTNAME,'') AS CUSTOMERNAME,

          LA.ApprovedLoanAmount

   

 

FROM LOANSUMMARY LS WITH(NOLOCK)

       INNER JOIN LOANAPPHDR LAP WITH(NOLOCK) ON LAP.APPLICATIONID = LS.APPLICATIONID

       INNER JOIN LOANAPPROVED LA WITH(NOLOCK) ON LA.LOANID = LS.LOANID

       INNER JOIN EMI E WITH(NOLOCK) ON E.LOANID = LS.LOANID AND SLNO=1

       LEFT OUTER JOIN (SELECT LOANID, SUM(EMI.ActualPenalty)TOTALPENALTY,SUM(EMI.PaidPenalty)PaidPenalty

                           ,SUM(EMI.PendingPenalty)PendingPenalty,SUM(PaidPrincipal) PaidPrincipal FROM EMI WITH(NOLOCK) GROUP BY LOANID)

                           AS E1 ON E1.LoanID=LS.Loanid

       LEFT OUTER JOIN (SELECT LOANID, Count(1) as Installmentoverdue, SUM(EMI.PendingInterest) PendingInterest, SUM(EMI.PendingPrincipal)PendingPrincipal,

                                     SUM(emi.PendingPenalty)PendingPenalty

                                     FROM EMI WITH(NOLOCK) inner join M_Branch b on emi.Enddate <= b.WorkingDate 

                                     and emi.EMIStatus <> 'P' and (isnull(emi.PendingInterest,0)+ isnull(emi.PendingInterest,0) + isnull(emi.PendingPenalty,0))>=0 and b.BranchID =1 GROUP BY LOANID)

                                     AS E2 ON E2.LoanID=LS.Loanid

       left outer join (select count(1) paidemi,loanid from emi with(nolock) where EMIStatus = 'P' group by loanid ) e3 on e3.LoanID = ls.Loanid

       left outer join (select count(1) totemi,loanid from emi with(nolock)  group by loanid ) e4 on e4.LoanID = ls.Loanid

       left outer join (select sum(r.Principal)Principal,r.LoanID from Receipt_Details r with(nolock)

                           inner join Receipt_Header rh  with(nolock)  on rh.ReceiptID = r.ReceiptID  group by r.LoanID ) rhr on rhr.LoanID = ls.Loanid

       INNER JOIN M_BRANCH MB WITH(NOLOCK) ON MB.BRANCHID = LS.BRANCHID

         INNER JOIN M_State AS STA WITH (nolock) ON STA.StateID = mb.StateID

       INNER JOIN M_SCHEMENAME MS WITH(NOLOCK) ON MS.SCHEMENAMEID = LAP.SCHEMEID

       INNER JOIN CUSTOMER C WITH(NOLOCK) ON C.CUSTOMERID = LS.CUSTOMERID

       --  INNER JOIN CustomerIDProof CID WITH(NOLOCK) ON CID.CUSTOMERID = LS.CUSTOMERID

       INNER JOIN M_WORKFLOW MW WITH(NOLOCK) ON MW.WORKFLOWID = LAP.WORKFLOWID

       --left outer join NonLoanOtherChargesDtl NLOCD with(nolock) on NLOCD.ApplicationID = LS.Applicationid

 

          left outer join ( select LoanID,sum(isnull(TotalPaid,0)) TotalPaid,sum(isnull(TotalDue,0)) TotalDue from NonLoanOtherCharges nlh

                                         inner join NonLoanOtherChargesDtl nld on nlh.HdrID=nld.NonLoanHdrID   group by LoanID )

                                         as NLOCD on NLOCD.LoanID=la.LoanId

 

       LEFT OUTER JOIN LOANPRECLOSUREHEADER LPH  WITH(NOLOCK) ON LPH.LOANID= LA.LOANID  AND  LPH.TYPE=7 AND ISDELETED=0

       LEFT OUTER JOIN (select LoanID,sum(Interest) as BILLED_INSTALLMENT from EMI where Enddate <= (select top 1 WorkingDate from M_Branch with(nolock) ) group by LoanID) as bill on bill.LoanID=la.LoanId

       LEFT OUTER JOIN (select LoanID,sum(Interest) as UNBILLED_INSTALLMENT from EMI where Enddate > (select top 1 WorkingDate from M_Branch with(nolock) ) group by LoanID) as unbill  on unbill.LoanID=la.LoanId

--where la.loanaccountnumber='FEDJHP0GL0784276'

 

 

 

GO
