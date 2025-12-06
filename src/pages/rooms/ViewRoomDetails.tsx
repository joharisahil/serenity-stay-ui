import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getRoomApi } from "@/api/roomApi";
import QRCode from "qrcode";

export default function ViewRoomDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrImage, setQrImage] = useState<string>("");

  const qrRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const data = await getRoomApi(id!);
        setRoom(data);

        // Generate QR code from qrUrl
        if (data.qrUrl) {
          const qr = await QRCode.toDataURL(data.qrUrl);
          setQrImage(qr);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadRoom();
  }, [id]);

  const downloadQR = () => {
    if (!qrImage) return;

    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `room_${room.number}_qr.png`;
    link.click();
  };

  if (loading) return <Layout><p>Loading room details...</p></Layout>;
  if (!room) return <Layout><p>Room not found</p></Layout>;

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/rooms/manage")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Room {room.number}</h1>
              <p className="text-muted-foreground">{room.type}</p>
            </div>
          </div>

          <Badge className="bg-primary text-white">
            {room.status}
          </Badge>
        </div>

        {/* Grid Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Room Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              {/* Basic Fields */}
              <div className="grid gap-4 sm:grid-cols-2">

                <Field label="Room Number" value={room.number} />
                <Field label="Type" value={room.type} />
                <Field label="Floor" value={room.floor} />
                <Field label="Max Guests" value={room.maxGuests} />
                <Field label="Base Rate" value={`₹${room.baseRate}`} />
                <Field label="Status" value={room.status} />
                <Field label="Created At" value={new Date(room.createdAt).toLocaleString()} />
                <Field label="Updated At" value={new Date(room.updatedAt).toLocaleString()} />

              </div>

              {/* Meal Plans */}
              {room.plans?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Meal Plans</p>
                  <div className="space-y-1 mt-2">
                    {room.plans.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm border-b py-1">
                        <span>{p.code} - {p.name}</span>
                        <span>Single Price-₹{p.singlePrice}</span>
                        <span>Double Price-₹{p.doublePrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extras */}
              {room.extras?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Extras</p>
                  <div className="space-y-1 mt-2">
                    {room.extras.map((e: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm border-b py-1">
                        <span>{e.name}</span>
                        <span>₹{e.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* QR CODE */}
          <Card>
            <CardHeader>
              <CardTitle>Room QR Code</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 flex flex-col items-center">

              {qrImage && (
                <img
                  ref={qrRef}
                  src={qrImage}
                  alt="Room QR"
                  className="w-48 h-48"
                />
              )}

              <Button onClick={downloadQR} className="w-full">
                Download QR
              </Button>

              <p className="text-sm text-center text-muted-foreground break-all">
                {room.qrUrl}
              </p>

            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
}


/* Reusable Field Component */
function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium break-all">{value}</p>
    </div>
  );
}
