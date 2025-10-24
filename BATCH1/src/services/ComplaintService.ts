import { supabase } from '../lib/supabase';
import { Complaint } from '../types';

export class ComplaintService {
  // Submit a new complaint
  static async submitComplaint(complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'adminResponse' | 'status'>): Promise<Complaint> {
    try {
      // For demo purposes, save to localStorage if no Supabase connection
      if (!import.meta.env.VITE_SUPABASE_URL) {
        const newComplaint: Complaint = {
          ...complaintData,
          id: crypto.randomUUID(),
          status: 'open',
          adminResponse: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const existingComplaints = await this.getUserComplaints(complaintData.userId);
        const updatedComplaints = [newComplaint, ...existingComplaints];
        localStorage.setItem(`complaints_${complaintData.userId}`, JSON.stringify(updatedComplaints));
        
        // Send email notification
        await this.sendComplaintNotification(newComplaint);
        
        return newComplaint;
      }
      
      const { data, error } = await supabase
        .from('complaints')
        .insert({
          user_id: complaintData.userId,
          business_name: complaintData.businessName,
          contact_email: complaintData.contactEmail,
          contact_phone: complaintData.contactPhone,
          complaint_type: complaintData.complaintType,
          subject: complaintData.subject,
          description: complaintData.description,
          priority: complaintData.priority,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      const complaint: Complaint = {
        id: data.id,
        userId: data.user_id,
        businessName: data.business_name,
        contactEmail: data.contact_email,
        contactPhone: data.contact_phone,
        complaintType: data.complaint_type,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: data.status,
        adminResponse: data.admin_response,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      // Send email notification to admin
      await this.sendComplaintNotification(complaint);

      return complaint;
    } catch (error) {
      console.error('Error submitting complaint:', error);
      throw error;
    }
  }

  // Send email notification to admin
  static async sendComplaintNotification(complaint: Complaint): Promise<void> {
    try {
      // In production, this would use a backend service to send emails
      // For now, we'll simulate the email sending
      const emailContent = {
        to: 'truetechitworldno1@gmail.com',
        subject: `New Complaint: ${complaint.subject} - ${complaint.priority.toUpperCase()} Priority`,
        body: `
          New complaint received from BRAINBOX RETAILPLUS:
          
          Business: ${complaint.businessName}
          Contact: ${complaint.contactEmail} | ${complaint.contactPhone}
          Type: ${complaint.complaintType.replace('_', ' ').toUpperCase()}
          Priority: ${complaint.priority.toUpperCase()}
          
          Subject: ${complaint.subject}
          
          Description:
          ${complaint.description}
          
          Submitted: ${complaint.createdAt.toLocaleString()}
          User ID: ${complaint.userId}
          Complaint ID: ${complaint.id}
          
          Please respond promptly for fast resolution.
          
          ---
          BrainBox-RetailPlus V25 Support System
          Powered by TIW
        `
      };

      console.log('Email notification sent to admin:', emailContent);
      
      // In production, integrate with email service like SendGrid, Nodemailer, etc.
      // await emailService.send(emailContent);
      
    } catch (error) {
      console.error('Error sending complaint notification:', error);
    }
  }

  // Get user's complaints
  static async getUserComplaints(userId: string): Promise<Complaint[]> {
    try {
      // For demo purposes, return localStorage data if no Supabase connection
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co') {
        const savedComplaints = localStorage.getItem(`complaints_${userId}`);
        if (savedComplaints) {
          const complaints = JSON.parse(savedComplaints);
          return complaints.map((complaint: any) => ({
            ...complaint,
            createdAt: new Date(complaint.createdAt),
            updatedAt: new Date(complaint.updatedAt)
          }));
        }
        return [];
      }
      
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(complaint => ({
        id: complaint.id,
        userId: complaint.user_id,
        businessName: complaint.business_name,
        contactEmail: complaint.contact_email,
        contactPhone: complaint.contact_phone,
        complaintType: complaint.complaint_type,
        subject: complaint.subject,
        description: complaint.description,
        priority: complaint.priority,
        status: complaint.status,
        adminResponse: complaint.admin_response,
        createdAt: new Date(complaint.created_at),
        updatedAt: new Date(complaint.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching user complaints:', error);
      return [];
    }
  }

  // Update complaint status (admin function)
  static async updateComplaintStatus(id: string, status: string, adminResponse?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (adminResponse) {
        updateData.admin_response = adminResponse;
      }

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }
  }
}