// src/pages/Contact.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ContactPage: React.FC = () => {
  // Replace with your Formspree endpoint
  const formspreeEndpoint = "https://formspree.io/f/xblyqopo";

  return (
    <>
      <div className="container mx-auto p-4 pt-20"> 
        <h1 className="text-3xl font-bold mb-6">Contactez-nous</h1>
        <form
          action={formspreeEndpoint}
          method="POST"
          className="max-w-lg mx-auto space-y-6"
        >
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </Label>
            <Input
              type="text"
              name="name"
              id="name"
              required
              className="mt-1 block w-full"
            />
          </div>

          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse Email
            </Label>
            <Input
              type="email"
              name="_replyto" // Formspree uses _replyto for the sender's email
              id="email"
              required
              className="mt-1 block w-full"
            />
          </div>

          <div>
            <Label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Sujet
            </Label>
            <Input
              type="text"
              name="subject"
              id="subject"
              required
              className="mt-1 block w-full"
            />
          </div>

          <div>
            <Label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </Label>
            <Textarea
              name="message"
              id="message"
              rows={4}
              required
              className="mt-1 block w-full"
            />
          </div>

          <div>
            <Button type="submit" className="w-full">
              Envoyer le message
            </Button>
          </div>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Ce formulaire utilise <a href="https://formspree.io/" target="_blank" rel="noopener noreferrer" className="underline">Formspree</a>.
          En soumettant ce formulaire, vous acceptez leurs conditions d'utilisation.
        </p>
      </div>
    </>
  );
};

export default ContactPage;
