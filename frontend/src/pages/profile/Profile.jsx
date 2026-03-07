import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Profile() {
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', username: '' });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Fetch current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => axios.get('/auth/user/'),
  });

  const user = userData?.data;

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
      });
    }
  }, [user]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data) => axios.patch('/auth/user/update/', data),
    onSuccess: () => {
      setProfileSuccess('Profile updated successfully.');
      setProfileError('');
      setTimeout(() => setProfileSuccess(''), 3000);
    },
    onError: (err) => {
      setProfileError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to update profile.');
      setProfileSuccess('');
    },
  });

  // Change password mutation
  const passwordMutation = useMutation({
    mutationFn: (data) => axios.post('/auth/change-password/', data),
    onSuccess: () => {
      setPasswordSuccess('Password changed successfully.');
      setPasswordError('');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    },
    onError: (err) => {
      setPasswordError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to change password.');
      setPasswordSuccess('');
    },
  });

  const handleProfileSubmit = () => {
    setProfileError('');
    updateMutation.mutate({
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      email: profileForm.email,
    });
  };

  const handlePasswordSubmit = () => {
    setPasswordError('');
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    passwordMutation.mutate({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password,
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account details.</p>
      </div>

      {/* Avatar + username display */}
      <Card>
        <CardContent className="p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="text-primary" size={32} />
          </div>
          <div>
            <p className="text-xl font-bold">{user?.first_name} {user?.last_name}</p>
            <p className="text-gray-500 text-sm flex items-center gap-1.5">
              <Mail size={13} /> {user?.email}
            </p>
            <Badge variant="secondary" className="mt-1 text-xs">@{user?.username}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User size={16} /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input
                value={profileForm.first_name}
                onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input
                value={profileForm.last_name}
                onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={profileForm.email}
              onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input value={profileForm.username} disabled className="bg-gray-50 text-gray-400" />
            <p className="text-xs text-gray-400">Username cannot be changed.</p>
          </div>

          {profileSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle size={15} /> {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle size={15} /> {profileError}
            </div>
          )}

          <Button onClick={handleProfileSubmit} disabled={updateMutation.isPending} className="w-full">
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock size={16} /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={passwordForm.old_password}
              onChange={e => setPasswordForm(p => ({ ...p, old_password: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input
              type="password"
              value={passwordForm.new_password}
              onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={passwordForm.confirm_password}
              onChange={e => setPasswordForm(p => ({ ...p, confirm_password: e.target.value }))}
            />
          </div>

          {passwordSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle size={15} /> {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle size={15} /> {passwordError}
            </div>
          )}

          <Button onClick={handlePasswordSubmit} disabled={passwordMutation.isPending} className="w-full">
            {passwordMutation.isPending ? 'Updating...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
