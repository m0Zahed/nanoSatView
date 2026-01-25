import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';

export function TestDialog() {
  const [open, setOpen] = useState(false);
  
  console.log('TestDialog render - open:', open);
  
  return (
    <div>
      <Button onClick={() => {
        console.log('Button clicked, setting open to true');
        setOpen(true);
      }}>
        Open Test Dialog
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>
              If you can see this, dialogs are working!
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <p className="text-white">This is test content</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
