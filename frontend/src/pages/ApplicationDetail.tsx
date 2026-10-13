import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApplication, getCreditScore } from '../services/api'
import type { ApplicationResponse, CreditScoreDetail } from '../types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Phone, MapPin, Briefcase, DollarSign, FileText, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const statusConfig: Record<string, { color: string; label: string }> = {
  pending:      { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',  label: 'Pending' },
  under_review: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',    label: 'Under Review' },
  approved:     { color: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Approved' },
  rejected:     { color: 'bg-red-500/10 text-red-600 border-red-500/20',       label: 'Rejected' },
}

const altDataLabels: Record<string, string> = {
  monthly_income:                'Monthly Income (₹)',
  monthly_expenses:              'Monthly Expenses (₹)',
  employment_type:               'Employment Type',
  employment_stability_years:    'Employment Stability (yrs)',
  number_of_dependents:          'Number of Dependents',
  existing_loan_count:           'Existing Loans',
  loan_repayment_history_score:  'Loan Repayment Score (0–10)',
  utility_bill_payment_score:    'Utility Bill Payment Score (0–10)',
  utility_payment_history:       'Utility Payment History',
  gig_platform_rating:           'Gig Platform Rating (0–5)',
  upi_transaction_frequency:     'UPI Transactions / Month',
  savings_account_balance:       'Savings Account Balance (₹)',
  remittance_frequency:          'Remittance Frequency / yr',
  community_verification_score:  'Community Verification Score (0–10)',
  microfinance_repayment_count:  'Microfinance Repayments',
}

function SHAPBar({ explanations }: { explanations: CreditScoreDetail['shap_explanations'] }) {
  const labels: Record<string, string> = {
    MonthlyIncome: 'Monthly Income', monthly_income_log: 'Income (scaled)',
    DebtRatio: 'Debt Ratio', age: 'Age', NumberOfTimes90DaysLate: 'Severe Late Payments',
    NumberOfOpenCreditLinesAndLoans: 'Credit Lines', total_late_payments: 'Total Late Payments',
  }
  const top = explanations.slice(0, 6)
  const maxAbs = Math.max(...top.map(e => Math.abs(e.shap_value)), 0.01)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Why this score? (SHAP Analysis)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.map((exp, i) => {
          const pos = exp.shap_value > 0
          return (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate mr-4 max-w-[180px]">
                {labels[exp.feature_name] || exp.feature_name}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {pos
                  ? <TrendingUp className="w-3 h-3 text-green-500" />
                  : <TrendingDown className="w-3 h-3 text-red-500" />
                }
                <span className={pos ? 'text-green-600 font-medium w-10 text-right' : 'text-red-600 font-medium w-10 text-right'}>
                  {pos ? '+' : ''}{exp.shap_value.toFixed(1)}
                </span>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pos ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.abs(exp.shap_value) / maxAbs * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [app, setApp] = useState<ApplicationResponse | null>(null)
  const [scoreDetail, setScoreDetail] = useState<CreditScoreDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    const applicationId = parseInt(id)
    setLoading(true)
    getApplication(applicationId)
      .then(data => {
        setApp(data)
        return getCreditScore(applicationId).catch(() => null)
      })
      .then(score => { if (score) setScoreDetail(score) })
      .catch(() => setError('Failed to load application details.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground">Loading application...</div>
    </div>
  )

  if (error || !app) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-destructive">{error || 'Application not found.'}</p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    </div>
  )

  const config = statusConfig[app.status] || statusConfig.pending
  const score = app.credit_score ? Math.round(app.credit_score) : null
  const riskColor = app.risk_category === 'low'
    ? 'bg-green-500/10 text-green-600 border-green-500/20'
    : app.risk_category === 'medium'
    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    : 'bg-red-500/10 text-red-600 border-red-500/20'

  const altData = app.alternative_data || {}
  const docLinks = app.document_links || {}

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">S</div>
            <span className="font-bold text-lg tracking-tight">Saral Credit</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Application #{app.application_id}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Submitted on {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Badge variant="outline" className={`${config.color} text-sm px-3 py-1 self-start sm:self-auto`}>
            {config.label}
          </Badge>
        </div>

        {/* Score card */}
        {score !== null && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Saral Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-4">
                <div className="text-6xl font-bold text-primary">{score}</div>
                {app.risk_category && (
                  <div className="pb-2">
                    <Badge variant="outline" className={riskColor}>{app.risk_category.toUpperCase()} RISK</Badge>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-background/60 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Requested Amount</div>
                  <div className="font-semibold">{formatCurrency(app.requested_amount)}</div>
                </div>
                <div className="p-3 rounded-lg bg-background/60 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Est. Interest Rate</div>
                  <div className="font-semibold">
                    {app.risk_category === 'low' ? '12%' : app.risk_category === 'medium' ? '18%' : '24%'} p.a.
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background/60 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Applicant Type</div>
                  <div className="font-semibold capitalize">{app.applicant_type}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personal details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {app.full_name && (
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Full Name</div>
                    <div className="font-medium">{app.full_name}</div>
                  </div>
                </div>
              )}
              {app.age && (
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Age</div>
                    <div className="font-medium">{app.age} years</div>
                  </div>
                </div>
              )}
              {app.phone_number && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Phone Number</div>
                    <div className="font-medium">{app.phone_number}</div>
                  </div>
                </div>
              )}
              {app.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Address</div>
                    <div className="font-medium">{app.address}</div>
                  </div>
                </div>
              )}
              {app.loan_purpose && (
                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Loan Purpose</div>
                    <div className="font-medium">{app.loan_purpose}</div>
                  </div>
                </div>
              )}
              {app.requested_amount && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Requested Amount</div>
                    <div className="font-medium">{formatCurrency(app.requested_amount)}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial footprint */}
        {Object.keys(altData).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />Financial Footprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(altData)
                  .filter(([, v]) => v !== null && v !== undefined && v !== '')
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0 text-sm">
                      <span className="text-muted-foreground">{altDataLabels[key] || key.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-right ml-4">
                        {typeof value === 'number'
                          ? (key.includes('income') || key.includes('expense') || key.includes('balance'))
                            ? `₹${value.toLocaleString('en-IN')}`
                            : value
                          : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document links */}
        {Object.keys(docLinks).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />Supporting Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(docLinks)
                  .filter(([, url]) => url)
                  .map(([name, url]) => (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group text-sm"
                    >
                      <span className="font-medium capitalize">{name.replace(/_/g, ' ')}</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SHAP explanation */}
        {scoreDetail && scoreDetail.shap_explanations?.length > 0 && (
          <SHAPBar explanations={scoreDetail.shap_explanations} />
        )}

        {/* Score detail stats */}
        {scoreDetail && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Score Details</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <div className="text-xs text-muted-foreground mb-1">Credit Score</div>
                <div className="text-2xl font-bold text-primary">{Math.round(scoreDetail.credit_score)}</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <div className="text-xs text-muted-foreground mb-1">Default Probability</div>
                <div className="text-2xl font-bold">{(scoreDetail.default_probability * 100).toFixed(1)}%</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <div className="text-xs text-muted-foreground mb-1">Risk Category</div>
                <div className="text-2xl font-bold capitalize">{scoreDetail.risk_category}</div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
        </Button>
      </main>
    </div>
  )
}
