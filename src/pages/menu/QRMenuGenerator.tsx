import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QRMenuGenerator() {
  const navigate = useNavigate();
  const menuUrl = window.location.origin + "/menu/customer";

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/menu")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">QR Menu Generator</h1>
            <p className="text-muted-foreground">Generate QR code for customer menu</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 p-8">
              <div className="rounded-lg border-4 border-primary p-4">
                <div className="h-64 w-64 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <p className="text-center text-muted-foreground">QR Code Preview<br/>(Scan to view menu)</p>
                </div>
              </div>
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Menu Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Menu URL</p>
                <div className="flex gap-2">
                  <Input
                    value={menuUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button size="icon" variant="outline">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-accent/10 p-4">
                <h3 className="font-semibold mb-2">How to Use:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Download the QR code image</li>
                  <li>Print and place it on tables</li>
                  <li>Customers can scan to view menu</li>
                  <li>Menu updates automatically</li>
                </ol>
              </div>

              <div className="rounded-lg bg-primary/10 p-4">
                <h3 className="font-semibold mb-2">Benefits:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Contactless menu viewing</li>
                  <li>Always up-to-date prices</li>
                  <li>Eco-friendly solution</li>
                  <li>Easy to share digitally</li>
                </ul>
              </div>

              <Button variant="outline" className="w-full" onClick={() => window.open(menuUrl, "_blank")}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview Customer Menu
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function Input({ value, readOnly, className }: { value: string; readOnly: boolean; className: string }) {
  return (
    <input
      type="text"
      value={value}
      readOnly={readOnly}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${className}`}
    />
  );
}
