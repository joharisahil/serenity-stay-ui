import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BookingHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => navigate("/banquet")}>
        <ArrowLeft />
      </Button>
      <div>
        <h1 className="text-3xl font-bold">Create Banquet Booking</h1>
        <p className="text-muted-foreground">
          Industry-standard banquet reservation
        </p>
      </div>
    </div>
  );
}
