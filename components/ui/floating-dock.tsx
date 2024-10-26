import React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

export function FloatingDock() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed bottom-4 left-4 flex items-center space-x-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Info className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Legal Information</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-2">
            <a
              href="https://www.iubenda.com/terms-and-conditions/67284368"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              Terms and Conditions
            </a>
            <a
              href="https://www.iubenda.com/privacy-policy/67284368/cookie-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              Cookie Policy
            </a>
            <a
              href="https://www.iubenda.com/privacy-policy/67284368"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              Privacy Policy
            </a>
          </div>
        </DialogContent>
      </Dialog>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "light" ? (
          <Moon className="h-[1.2rem] w-[1.2rem]" />
        ) : (
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        )}
      </Button>
    </div>
  );
}
