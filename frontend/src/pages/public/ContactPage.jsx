import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <Badge variant="primary" size="sm">Institutional & Corporate Inquiries</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Connect with the SKILLPROOF Team
        </h1>
        <p className="text-slate-600 text-sm">
          Partner with us to deploy the Verified Skill Ecosystem across your institution or recruitment workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Info */}
        <Card className="p-6 sm:p-7 flex flex-col justify-between">
          <CardContent className="p-0 space-y-6">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Ecosystem Coordination</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                For academic accreditations, FDP setups, enterprise API integration, or institutional partnership inquiries.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-500 text-[11px] font-medium">Official Inquiries</div>
                  <div className="font-semibold text-slate-900">contact@skillproof.edu</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-500 text-[11px] font-medium">Toll-Free Helpline</div>
                  <div className="font-semibold text-slate-900">+91 1800 260 4400</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-500 text-[11px] font-medium">Headquarters</div>
                  <div className="font-semibold text-slate-900">AICTE & MoE Innovation Cell, New Delhi</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="p-6 sm:p-7">
          <CardContent className="p-0">
            {submitted ? (
              <div className="text-center py-10 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-slate-900 text-base">Inquiry Dispatched</h3>
                <p className="text-xs text-slate-600">Our ecosystem coordination team will respond within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Dr. / Prof. / Mr. / Ms."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="name@organization.edu"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Organization / Institution</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. ABES Engineering College"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Message</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="How can we assist your institution or enterprise?"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  icon={Send}
                >
                  Send Inquiry
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactPage;
