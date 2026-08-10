import React, { useState } from 'react';
import { Building2, Plus, QrCode, UserPlus, ShieldAlert, ShieldCheck, Trash2, Edit, MapPin, Clock, Palette } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface Club {
  id: string;
  name: string;
  slug: string;
  county: string;
  city: string;
  address: string;
  gpsCoordinates: string;
  brandColor: string;
  openingHours: string;
  closingHours: string;
  subscriptionStatus: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  isActive: boolean;
  phone: string;
  email: string;
  managerName?: string;
  tableCount: number;
}

const INITIAL_CLUBS: Club[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'The Alchemist Westlands',
    slug: 'alchemist-westlands',
    county: 'Nairobi',
    city: 'Nairobi',
    address: 'Parklands Road, Westlands',
    gpsCoordinates: '-1.2683, 36.8066',
    brandColor: '#e11d48',
    openingHours: '14:00',
    closingHours: '04:00',
    subscriptionStatus: 'ACTIVE',
    isActive: true,
    phone: '+254712345678',
    email: 'info@alchemist.co.ke',
    managerName: 'John Alchemist Manager',
    tableCount: 15,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'B-Club Kilimani',
    slug: 'bclub-kilimani',
    county: 'Nairobi',
    city: 'Nairobi',
    address: 'Galana Plaza, Kilimani',
    gpsCoordinates: '-1.2905, 36.7822',
    brandColor: '#8b5cf6',
    openingHours: '20:00',
    closingHours: '06:00',
    subscriptionStatus: 'ACTIVE',
    isActive: true,
    phone: '+254722998877',
    email: 'vip@bclub.co.ke',
    managerName: 'Sarah B-Club Manager',
    tableCount: 25,
  },
];

export const ClubManagementPage: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>(INITIAL_CLUBS);
  const [search, setSearch] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State for New Club
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    county: 'Nairobi',
    city: 'Nairobi',
    address: '',
    gpsCoordinates: '',
    brandColor: '#e11d48',
    openingHours: '14:00',
    closingHours: '04:00',
    phone: '',
    email: '',
  });

  const toggleClubStatus = (id: string) => {
    setClubs((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              isActive: !c.isActive,
              subscriptionStatus: !c.isActive ? 'ACTIVE' : 'SUSPENDED',
            }
          : c
      )
    );
  };

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    const newClub: Club = {
      id: `club-${Date.now()}`,
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      county: formData.county,
      city: formData.city,
      address: formData.address,
      gpsCoordinates: formData.gpsCoordinates,
      brandColor: formData.brandColor,
      openingHours: formData.openingHours,
      closingHours: formData.closingHours,
      subscriptionStatus: 'ACTIVE',
      isActive: true,
      phone: formData.phone,
      email: formData.email,
      tableCount: 0,
    };
    setClubs([newClub, ...clubs]);
    setIsCreateModalOpen(false);
    setFormData({
      name: '',
      slug: '',
      county: 'Nairobi',
      city: 'Nairobi',
      address: '',
      gpsCoordinates: '',
      brandColor: '#e11d48',
      openingHours: '14:00',
      closingHours: '04:00',
      phone: '',
      email: '',
    });
  };

  const filteredClubs = clubs.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase());
    const matchesCounty = selectedCounty === 'ALL' || c.county === selectedCounty;
    return matchesSearch && matchesCounty;
  });

  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-500 border border-brand-500/40">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">System Admin • Club Management</h1>
            <p className="text-xs text-slate-400">Manage SaaS venue tenants, subscriptions, managers & QR codes</p>
          </div>
        </div>

        <Button size="lg" className="flex items-center space-x-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Register New Venue</span>
        </Button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4">
        <input
          type="text"
          placeholder="Search club name or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 rounded-xl border border-slate-800 bg-dark-900 px-4 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
        />

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400">Filter County:</span>
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="rounded-xl border border-slate-800 bg-dark-900 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
          >
            <option value="ALL">All Counties</option>
            <option value="Nairobi">Nairobi</option>
            <option value="Mombasa">Mombasa</option>
            <option value="Nakuru">Nakuru</option>
            <option value="Kiambu">Kiambu</option>
            <option value="Kisumu">Kisumu</option>
          </select>
        </div>
      </div>

      {/* Club Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {filteredClubs.map((club) => (
          <div key={club.id} className="glass-panel p-6 space-y-4 border-slate-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="h-5 w-5 rounded-full border border-white/20 shadow-md"
                    style={{ backgroundColor: club.brandColor }}
                  />
                  <div>
                    <h3 className="text-lg font-bold text-white">{club.name}</h3>
                    <p className="text-xs font-mono text-slate-400">/v/{club.slug}</p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold border ${
                    club.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {club.subscriptionStatus}
                </span>
              </div>

              {/* Attributes Details */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-500" />
                  <span>{club.county} • {club.address}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>{club.openingHours} - {club.closingHours}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Palette className="h-3.5 w-3.5 text-purple-400" />
                  <span>GPS: {club.gpsCoordinates || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <QrCode className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{club.tableCount} Active Tables</span>
                </div>
              </div>

              {/* Manager Badge */}
              <div className="rounded-xl bg-dark-900/90 p-2.5 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Assigned Manager:</span>
                <span className="font-semibold text-slate-200">{club.managerName || 'Unassigned'}</span>
              </div>
            </div>

            {/* Admin Action Buttons */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={club.isActive ? 'secondary' : 'primary'}
                onClick={() => toggleClubStatus(club.id)}
                className="flex items-center space-x-1"
              >
                {club.isActive ? (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                    <span>Suspend</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Activate</span>
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => alert(`Assign Manager to ${club.name}`)}
                className="flex items-center space-x-1"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Manager</span>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => alert(`Generate QR Codes for ${club.name}`)}
                className="flex items-center space-x-1"
              >
                <QrCode className="h-3.5 w-3.5 text-brand-500" />
                <span>QR Codes</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create New Club Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Register New SaaS Club / Venue</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClub} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Club Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Alchemist Westlands"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Slug</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. alchemist-westlands"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">County</label>
                  <select
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="Nairobi">Nairobi</option>
                    <option value="Mombasa">Mombasa</option>
                    <option value="Nakuru">Nakuru</option>
                    <option value="Kiambu">Kiambu</option>
                    <option value="Kisumu">Kisumu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GPS Coordinates</label>
                  <input
                    type="text"
                    placeholder="-1.2683, 36.8066"
                    value={formData.gpsCoordinates}
                    onChange={(e) => setFormData({ ...formData, gpsCoordinates: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Brand Color</label>
                  <input
                    type="color"
                    value={formData.brandColor}
                    onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-700 bg-dark-900 p-1"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Opening Hour</label>
                  <input
                    type="text"
                    placeholder="14:00"
                    value={formData.openingHours}
                    onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Closing Hour</label>
                  <input
                    type="text"
                    placeholder="04:00"
                    value={formData.closingHours}
                    onChange={(e) => setFormData({ ...formData, closingHours: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Parklands Road, Westlands"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <Button type="submit" size="lg" className="w-full pt-3">
                Save & Register Venue
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
