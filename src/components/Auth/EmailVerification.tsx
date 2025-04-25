import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, CircularProgress, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { useWallet } from '@/context/WalletContext';
import { getUserData, updateUserEmail } from '@/api/userApi';

const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

const EmailVerification = () => {
  const { email, isVerified, setEmail, setIsVerified } = useUser();
  const { address } = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: email || '',
    },
  });
  
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!address) return;
      
      try {
        setLoading(true);
        const userData = await getUserData(address);
        console.log("Fetched user verification status:", userData);
        
        if (userData?.email_verified) {
          setEmail(userData.email);
          setIsVerified(true);
          emailForm.setValue('email', userData.email || '');
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkVerificationStatus();
  }, [address]);
  
  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      setSubmitting(true);
      console.log(`Submitting email: ${values.email} for address ${address}`);
      
      const success = await updateUserEmail(address, values.email);
      
      if (success) {
        setEmail(values.email);
        setIsVerified(true);
        toast.success("Email verified successfully");
      } else {
        toast.error("Failed to verify email");
      }
    } catch (error) {
      console.error("Error during email verification:", error);
      toast.error("An error occurred during verification");
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
        <CircularProgress size={16} sx={{ mr: 1 }} />
        <span style={{ fontFamily: 'Bungee' }}>Checking verification status...</span>
      </Box>
    );
  }
  
  if (isVerified && email) {
    return (
      <Alert severity="success" sx={{ fontFamily: 'Bungee' }}>
        Email: <span style={{ fontWeight: 500 }}>{email}</span>
      </Alert>
    );
  }
  
  return (
    <Box component="form" onSubmit={emailForm.handleSubmit(onEmailSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        {...emailForm.register('email')}
        label="Email"
        type="email"
        error={!!emailForm.formState.errors.email}
        helperText={emailForm.formState.errors.email?.message}
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        disabled={submitting}
        sx={{ fontFamily: 'Bungee' }}
      >
        {submitting ? 'Verifying...' : 'Verify Email'}
      </Button>
    </Box>
  );
};

export default EmailVerification;
