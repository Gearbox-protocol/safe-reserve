import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SparklesIcon } from "lucide-react";

interface DialogFormProps {
  title: string;
  isFormValid: boolean;
  isLoading?: boolean;
  saveButtonText?: string;
  loadingText?: string;
  onCancel: () => void;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  aiHelp?: () => void;
  aiHelpDisabled?: boolean;
}

export function DialogForm({
  onSubmit,
  isFormValid,
  isLoading,
  title,
  children,
  onCancel,
  saveButtonText = "Save changes",
  loadingText = "Saving...",
  aiHelp,
  aiHelpDisabled = false,
}: DialogFormProps) {
  const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e);
  };
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="bg-[#141414] p-8 rounded-lg w-full max-w-4xl min-h-[300px] flex flex-col justify-between">
        <form
          onSubmit={onSubmitHandler}
          //   className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {children}
          <DialogFooter className="w-full mt-8">
            <div className="flex items-center w-full justify-between">
              <div className="flex items-center space-x-2">
                {aiHelp && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={aiHelp}
                    className="bg-transparent border border-gray-500 text-gray-300 hover:bg-gray-800 px-6 py-2"
                    disabled={aiHelpDisabled}
                  >
                    <SparklesIcon className="w-4 h-4 mr-1" />
                    Ask Geary
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="bg-transparent border border-gray-500 text-gray-300 hover:bg-gray-800 px-6 py-2"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!isFormValid || isLoading}
                  type="submit"
                  variant="pink"
                >
                  {isLoading ? loadingText : saveButtonText || "Save changes"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
