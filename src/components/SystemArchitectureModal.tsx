import React, { useState } from 'react';
import {
  X,
  Database,
  ShieldCheck,
  GitBranch,
  Cpu,
  Layers,
  CheckCircle2,
  Copy,
  ChevronRight,
  Sparkles,
  Lock,
  QrCode,
  FileText,
} from 'lucide-react';

interface SystemArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<'architecture' | 'schema' | 'state_machine' | 'algorithm' | 'ux_flow'>('architecture');
  const [copiedCode, setCopiedCode] = useState<string>('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-wide text-white">
                  NellyGo — System Architecture &amp; Engineering Blueprint
                </span>
                <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                  Architecture Deliverables
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-end specification for Nelly's Salon / Barbershop (Generisa Soriano, Los Baños, Laguna)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveSection('architecture')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'architecture' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. System Architecture</span>
          </button>

          <button
            onClick={() => setActiveSection('schema')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'schema' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>2. Firestore NoSQL &amp; Shadow CRM</span>
          </button>

          <button
            onClick={() => setActiveSection('state_machine')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'state_machine' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>3. State Machine &amp; Workflow Matrix</span>
          </button>

          <button
            onClick={() => setActiveSection('algorithm')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'algorithm' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>4. Slot Calculation Algorithm</span>
          </button>

          <button
            onClick={() => setActiveSection('ux_flow')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'ux_flow' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>5. Frictionless QR-to-Booking UX</span>
          </button>
        </div>

        {/* Section Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-300">
          {/* 1. SYSTEM ARCHITECTURE & GUARDS */}
          {activeSection === 'architecture' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  1. High-Level System Architecture &amp; Authentication Guard
                </h3>
                <p className="text-slate-400">
                  NellyGo decouples client public booking (100% guest frictionless) from provider administrative controls (secured via Firebase Auth &amp; ABAC rules).
                </p>
              </div>

              {/* Architecture Diagram */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[11px] space-y-2 leading-relaxed text-slate-300">
                <div className="text-amber-400 font-bold">CLIENT ENTRY (Public Web / Mobile Browser)</div>
                <div>├── Physical QR Code Scan (Mirror / Card / Flyer) or Direct URL</div>
                <div>├── Frictionless Guest Checkout (NO Auth / NO Account Creation)</div>
                <div>│    ├── Service Catalog (Multi-select, dynamic duration calculation)</div>
                <div>│    ├── Los Baños Coverage Validation (Baybayin Base ₱0, Outlying zones ₱50-₱90)</div>
                <div>│    ├── Real-Time Availability Engine (Conflict &amp; Travel Buffer Guard)</div>
                <div>│    └── Guest Contact Form (Phone, Name, Address, Landmark, Requests)</div>
                <div>└── Alphanumeric Booking Reference Generation (NG-XXXXXX)</div>
                <div className="pt-2 text-emerald-400 font-bold">PROVIDER ENTRY (Admin Portal Guard)</div>
                <div>├── Route /admin Guard: Firebase Auth verifyToken() + Email Check</div>
                <div>├── Operations Dashboard (Daily schedule, map navigation to Los Baños houses)</div>
                <div>├── Workload Engine (Enforces 5 max visits/day &amp; 30m travel buffer)</div>
                <div>└── Shadow Client CRM (Composite key aggregation by Normalized Phone)</div>
              </div>

              {/* Security Guard Code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">Admin Guard &amp; Public Guest Routing Pattern</span>
                  <button
                    onClick={() => copyToClipboard(`// Admin Route Guard
export function AdminGuard({ children, user }: { children: React.ReactNode; user: User | null }) {
  if (!user || user.email !== 'generisa.nellygo@gmail.com') {
    return <AdminLoginPrompt />;
  }
  return <>{children}</>;
}`, 'guard')}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCode === 'guard' ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-amber-200/90 overflow-x-auto">
{`// Admin Route Guard Pattern in React / Firebase Auth
export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebaseAuth();
  const ALLOWED_ADMINS = ['generisa.nellygo@gmail.com', 'admin@nellygo.com'];

  if (loading) return <LoadingSpinner />;
  
  // Strict identity check: only Generisa Soriano has admin access
  if (!user || !ALLOWED_ADMINS.includes(user.email || '')) {
    return <AdminLoginModal />;
  }

  return <AdminDashboard providerUser={user} />;
}`}
                </pre>
              </div>
            </div>
          )}

          {/* 2. FIRESTORE NOSQL & SHADOW CRM */}
          {activeSection === 'schema' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  2. Firestore NoSQL Database Schema &amp; Shadow Client Profiles
                </h3>
                <p className="text-slate-400">
                  Because clients are guests without user IDs, we link guest bookings to "Shadow" client profiles using a composite key: <code className="text-amber-400 font-mono">cp-&#123;normalizedPhone&#125;</code>.
                </p>
              </div>

              {/* Collections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 font-mono">/bookings/&#123;bookingId&#125;</span>
                    <span className="text-[10px] text-slate-500">Root Collection</span>
                  </div>
                  <ul className="space-y-1 text-slate-400 font-mono text-[10px]">
                    <li>• <span className="text-slate-200">id</span>: string (PK)</li>
                    <li>• <span className="text-slate-200">referenceId</span>: string (e.g. "NG-7K4X29")</li>
                    <li>• <span className="text-slate-200">guestPhone</span>: string (Composite Key index)</li>
                    <li>• <span className="text-slate-200">guestName</span>: string</li>
                    <li>• <span className="text-slate-200">address</span>: string (Exact home location)</li>
                    <li>• <span className="text-slate-200">barangay</span>: string (Los Baños zone)</li>
                    <li>• <span className="text-slate-200">bookingDate</span>: "YYYY-MM-DD"</li>
                    <li>• <span className="text-slate-200">startTime</span>, <span className="text-slate-200">endTime</span>: "HH:mm"</li>
                    <li>• <span className="text-slate-200">totalDurationMinutes</span>: number</li>
                    <li>• <span className="text-slate-200">travelFee</span>: number (Zones surcharge)</li>
                    <li>• <span className="text-slate-200">status</span>: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 font-mono">/clientShadowProfiles/&#123;cp-phone&#125;</span>
                    <span className="text-[10px] text-slate-500">CRM Shadow Collection</span>
                  </div>
                  <ul className="space-y-1 text-slate-400 font-mono text-[10px]">
                    <li>• <span className="text-slate-200">id</span>: string ("cp-09175558123")</li>
                    <li>• <span className="text-slate-200">phone</span>: string (Normalized)</li>
                    <li>• <span className="text-slate-200">totalBookings</span>: number</li>
                    <li>• <span className="text-slate-200">completedBookings</span>: number</li>
                    <li>• <span className="text-slate-200">cancellations</span>: number</li>
                    <li>• <span className="text-slate-200">totalSpent</span>: number (PHP)</li>
                    <li>• <span className="text-slate-200">hairPreferences</span>: string (Clippers, fade, dye)</li>
                    <li>• <span className="text-slate-200">privateNotes</span>: string (Gate bell, dog, tips)</li>
                    <li>• <span className="text-slate-200">isVip</span>: boolean</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400 font-mono">/serviceZones/&#123;zoneId&#125;</span>
                    <span className="text-[10px] text-slate-500">Coverage Collection</span>
                  </div>
                  <ul className="space-y-1 text-slate-400 font-mono text-[10px]">
                    <li>• <span className="text-slate-200">barangay</span>: string (e.g. "Batong Malake")</li>
                    <li>• <span className="text-slate-200">travelFee</span>: number (e.g. 50 PHP)</li>
                    <li>• <span className="text-slate-200">estimatedTransitMinutes</span>: number (15m)</li>
                    <li>• <span className="text-slate-200">isActive</span>: boolean</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 font-mono">/settings/general</span>
                    <span className="text-[10px] text-slate-500">Business Config</span>
                  </div>
                  <ul className="space-y-1 text-slate-400 font-mono text-[10px]">
                    <li>• <span className="text-slate-200">dailyBookingCap</span>: number (e.g. 5)</li>
                    <li>• <span className="text-slate-200">travelBufferMinutes</span>: number (e.g. 30)</li>
                    <li>• <span className="text-slate-200">restDays</span>: [1] (Mondays)</li>
                    <li>• <span className="text-slate-200">minCancellationHours</span>: number (24)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 3. STATE MACHINE & WORKFLOW MATRIX */}
          {activeSection === 'state_machine' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  3. State Transition Diagram &amp; Workflow Matrix
                </h3>
                <p className="text-slate-400">
                  Strict lifecycle transitions governing appointment states, triggers, side-effects, and authorized actors.
                </p>
              </div>

              {/* State Transition Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono">
                    <tr>
                      <th className="p-3">Current State</th>
                      <th className="p-3">Action / Trigger</th>
                      <th className="p-3">Next State</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Automated Side Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono text-[10px]">
                    <tr>
                      <td className="p-3 text-amber-400 font-bold">NONE</td>
                      <td className="p-3">Submit Guest Booking</td>
                      <td className="p-3 text-amber-300 font-bold">pending</td>
                      <td className="p-3 text-slate-300">Guest</td>
                      <td className="p-3 text-slate-400">Generates Ref ID (NG-XXXXXX), alerts provider dashboard</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-amber-300 font-bold">pending</td>
                      <td className="p-3">Approve Request</td>
                      <td className="p-3 text-emerald-400 font-bold">confirmed</td>
                      <td className="p-3 text-amber-400">Provider</td>
                      <td className="p-3 text-slate-400">Triggers Confirmation SMS to guest with address &amp; arrival time</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-emerald-400 font-bold">confirmed</td>
                      <td className="p-3">Arrived &amp; Start</td>
                      <td className="p-3 text-blue-400 font-bold">in_progress</td>
                      <td className="p-3 text-amber-400">Provider</td>
                      <td className="p-3 text-slate-400">Locks appointment, updates live status on Track Booking page</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-blue-400 font-bold">in_progress</td>
                      <td className="p-3">Record Payment</td>
                      <td className="p-3 text-white font-bold">completed</td>
                      <td className="p-3 text-amber-400">Provider</td>
                      <td className="p-3 text-slate-400">Updates Shadow CRM visit counter &amp; total revenue ledger</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-amber-300 font-bold">pending / confirmed</td>
                      <td className="p-3">Cancel (&gt;24h)</td>
                      <td className="p-3 text-red-400 font-bold">cancelled</td>
                      <td className="p-3 text-slate-300">Guest / Provider</td>
                      <td className="p-3 text-slate-400">Frees calendar slot, updates client cancellation frequency</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-emerald-400 font-bold">confirmed</td>
                      <td className="p-3">Guest Unavailable</td>
                      <td className="p-3 text-rose-400 font-bold">no_show</td>
                      <td className="p-3 text-amber-400">Provider</td>
                      <td className="p-3 text-slate-400">Flags shadow client reliability score to Caution</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. SLOT CALCULATION ALGORITHM */}
          {activeSection === 'algorithm' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  4. Slot Availability Calculation &amp; Overlap Prevention Algorithm
                </h3>
                <p className="text-slate-400">
                  Mathematical proof of conflict-free scheduling with motorcycle travel buffer windows and daily fatigue caps.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 font-mono text-[11px]">
                <div className="text-amber-400 font-bold">Formula &amp; Time Bounds:</div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-200">
                  <div>1. Candidate Slot Window: <span className="text-amber-300">[S_start, S_end]</span> where <span className="text-amber-300">S_end = S_start + TotalServiceDuration</span></div>
                  <div>2. Existing Booking Window: <span className="text-emerald-300">[B_start, B_end]</span></div>
                  <div>3. Travel Buffer Protection Window: <span className="text-rose-300">[B_start - Buffer, B_end + Buffer]</span></div>
                  <div className="mt-2 text-slate-400">Conflict Condition: <code className="text-amber-400 font-bold">S_start &lt; (B_end + Buffer) &amp;&amp; S_end &gt; (B_start - Buffer)</code></div>
                </div>

                <div className="text-slate-400">
                  Daily Workload Check: <code className="text-emerald-400">activeBookings.length &gt;= dailyBookingCap &#8594; Block Day</code>
                </div>
              </div>

              <div>
                <span className="font-bold text-white block mb-1.5">TypeScript Algorithm Implementation (from scheduling.ts)</span>
                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-300 overflow-x-auto">
{`for (let startM = openMinutes; startM + totalServiceDuration <= closeMinutes; startM += stepMinutes) {
  const endM = startM + totalServiceDuration;
  let hasConflict = false;

  for (const b of activeBookings) {
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);

    // Direct overlap or buffer encroachment across Los Baños transit
    const protectedStart = Math.max(openMinutes, bStart - travelBufferMinutes);
    const protectedEnd = Math.min(closeMinutes, bEnd + travelBufferMinutes);

    if (startM < protectedEnd && endM > protectedStart) {
      hasConflict = true;
      break;
    }
  }

  slots.push({
    time: minutesToTime(startM),
    endTime: minutesToTime(endM),
    available: !hasConflict
  });
}`}
                </pre>
              </div>
            </div>
          )}

          {/* 5. FRICTIONLESS QR-TO-BOOKING UX */}
          {activeSection === 'ux_flow' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  5. End-to-End Frictionless UX Flow (QR Code to Confirmation)
                </h3>
                <p className="text-slate-400">
                  Eliminates the friction of typical service apps (no download, no password, no email verification wait).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-between space-y-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">1</div>
                  <h4 className="font-bold text-white text-xs">Scan QR / Click Link</h4>
                  <p className="text-[10px] text-slate-400">Client scans physical salon flyer, business card, or clicks shared URL.</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-between space-y-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">2</div>
                  <h4 className="font-bold text-white text-xs">Select Services</h4>
                  <p className="text-[10px] text-slate-400">Haircut, Keratin, Grooming, Manicure. Dynamic duration and subtotal tallies.</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-between space-y-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">3</div>
                  <h4 className="font-bold text-white text-xs">Zone &amp; Address</h4>
                  <p className="text-[10px] text-slate-400">Selects Los Baños barangay. Live travel fee added. Exact street &amp; landmark.</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-between space-y-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">4</div>
                  <h4 className="font-bold text-white text-xs">Intelligent Slot</h4>
                  <p className="text-[10px] text-slate-400">Available slots calculated taking transit buffer &amp; daily cap into account.</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-between space-y-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">5</div>
                  <h4 className="font-bold text-white text-xs">Reference ID</h4>
                  <p className="text-[10px] text-slate-400">Instant alphanumeric Ref ID (NG-XXXXXX) + SMS alert. Track any time!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">NellyGo System Architecture v1.0 • Generisa Soriano</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};
