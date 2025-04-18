import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { useWallet } from '@/context/WalletContext';
import { getUserData, updateUserEmail } from '@/api/userApi';

const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

const EmailVerification = () => {
  const { email, isVerified, setEmail, setIsVerified, fetchUserData } = useUser();
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
    const checkExistingEmail = async () => {
      if (address) {
        try {
          setLoading(true);
          const userData = await getUserData(address);
          console.log("Fetched user data:", userData);
          
          if (userData) {
            if (userData.email) {
              setEmail(userData.email);
              emailForm.setValue('email', userData.email);
            }
            
            if (userData.email_verified) {
              console.log("Email is verified:", userData.email);
              setIsVerified(true);
            }
          }
        } catch (error) {
          console.error("Error checking for existing email:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    checkExistingEmail();
  }, [address]);
  
  useEffect(() => {
    if (email) {
      emailForm.setValue('email', email);
    }
  }, [email]);
  
  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }
    
    setSubmitting(true);
    
    try {
      setEmail(values.email);
      
      console.log(`Saving email ${values.email} for wallet ${address}`);
      
      const success = await updateUserEmail(address, values.email);
      
      if (success) {
        setIsVerified(true);
        toast.success('Email saved successfully');
        await fetchUserData();
      } else {
        toast.error('Failed to save email. Please try again.');
      }
    } catch (error) {
      console.error('Error saving email:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center p-4 text-sm rounded-lg border bg-card">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse mr-2"></div>
        <span className="font-bungee">Checking email verification status...</span>
      </div>
    );
  }
  
  if (isVerified && email) {
    return (
      <div className="flex items-center p-4 text-sm rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
        <span className="font-bungee">Email: <span className="font-medium">{email}</span></span>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border p-4 bg-card">
      <h3 className="text-lg font-luckiest mb-4">Add Your Email</h3>
      
      <p className="text-sm text-muted-foreground mb-4 font-bungee">
        Add Email to verify Claim
      </p>
      <Form {...emailForm}>
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          <FormField
            control={emailForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} className="font-bungee" />
                </FormControl>
                <FormMessage className="font-bungee" />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={submitting} className="font-bungee">
            {submitting ? 'Saving...' : 'Save Email'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EmailVerification;
