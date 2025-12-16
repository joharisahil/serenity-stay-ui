import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { getMenuItemsApi } from "@/api/menuItemApi";
import { Printer, Trash2 } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createManualRestaurantBillApi } from "@/api/manualBillApi";
import { toast } from "sonner";
import { getHotelApi } from "@/api/hotelApi";
import api from "@/api/authApi";
import { transferRestaurantBillToRoomApi } from "@/api/billingRestaurantApi";
import debounce from "lodash.debounce";
import { searchMenuItemsApi } from "@/api/menuApi";

export default function CreateRestaurantBill() {
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [billItems, setBillItems] = useState([]);

    const [customerName, setCustomerName] = useState("");
    const [customerNumber, setCustomerNumber] = useState("");
    const [tableNumber, setTableNumber] = useState("");

    // discount system
    const [discountInput, setDiscountInput] = useState<number | string>(0);
    const [discountPercent, setDiscountPercent] = useState(0);

    const [gstEnabled, setGstEnabled] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState("cash");

    const [hotel, setHotel] = useState<any>(null);

    const [printedBillNumber, setPrintedBillNumber] = useState("");
    const [printedBillDate, setPrintedBillDate] = useState("");

    const [openRoomTransfer, setOpenRoomTransfer] = useState(false);
    const [roomsToday, setRoomsToday] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");

    const CGST = 2.5;
    const SGST = 2.5;

    useEffect(() => {
        (async () => {
            const items = await getMenuItemsApi();
            setMenuItems(items);

            // 🔹 fetch hotel details
            try {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                if (user?.hotel_id) {
                    const res = await getHotelApi(user.hotel_id);
                    if (res.success) setHotel(res.hotel);
                }
            } catch (e) {
                console.error("Failed to load hotel details", e);
            }
        })();
    }, []);


    const loadOccupiedRooms = async () => {
        try {
            const res = await api.get("/room-bookings/active-today");

            if (res.data.success) {
                setRoomsToday(res.data.rooms); // rooms already include booking
            }
        } catch (err) {
            console.error("Failed to load rooms", err);
        }
    };


    useEffect(() => {
        if (openRoomTransfer) loadOccupiedRooms();
    }, [openRoomTransfer]);


    // total count badge for each item tile
    const getItemCount = (id: string) =>
        billItems.filter((b) => b._id === id).reduce((sum, b) => sum + b.qty, 0);

    // ADD item to bill
    const addToBill = (item, variant, price) => {
        const existing = billItems.find(
            (b) => b._id === item._id && b.variant === variant
        );

        if (existing) {
            existing.qty += 1;
            setBillItems([...billItems]);
        } else {
            setBillItems([
                ...billItems,
                {
                    _id: item._id,
                    name: item.name,
                    variant,
                    qty: 1,
                    price,
                },
            ]);
        }
    };

    // REMOVE item
    const removeFromBill = (id, variant) => {
        setBillItems(billItems.filter((b) => !(b._id === id && b.variant === variant)));
    };

    // ---------------------- BILL CALCULATIONS -------------------------
    const subtotal = billItems.reduce((sum, i) => sum + i.qty * i.price, 0);

    const discountAmount = (subtotal * discountPercent) / 100;

    const taxable = subtotal - discountAmount;

    const cgstAmount = gstEnabled ? (taxable * CGST) / 100 : 0;
    const sgstAmount = gstEnabled ? (taxable * SGST) / 100 : 0;

    const grandTotal = taxable + cgstAmount + sgstAmount;
    // ---------------------------------------------------------------------

    const printBill = () => {
        const w = window.open("", "_blank", "width=280,height=600");

        if (!w) {
            alert("Please enable pop-ups to print.");
            return;
        }

        const kotHtml = `
        <html>
        <head>
            <title>Bill</title>
            <style>
                @page { margin: 0; size: auto; }

                body {
                    font-family: monospace;
                    font-size: 12px;
                    margin: 0;
                    padding: 4px;
                    width: 48mm;
                }

                .center { text-align: center; }
                .bold { font-weight: bold; }
                hr { border-top: 1px dashed #000; margin: 4px 0; }
                .row { display: flex; justify-content: space-between; }
            </style>
        </head>

        <body>
            <div class="center bold">${hotel?.name || ""}</div>
            <div class="center">${hotel?.address || ""}</div>
            ${hotel?.phone ? `<div class="center">Ph: ${hotel.phone}</div>` : ""}
            ${hotel?.gstNumber ? `<div class="center">GSTIN: ${hotel.gstNumber}</div>` : ""}
            <hr/>

            <div>Bill No: ${printedBillNumber}</div>
            <div>Date: ${printedBillDate}</div>

            <hr/>
            <div class="center bold">RESTAURANT BILL</div>
            <hr/>

            <div>Customer: ${customerName}</div>
            <div>Mobile: ${customerNumber}</div>
            <div>Table: ${tableNumber}</div>
            <div>Payment: ${paymentMethod.toUpperCase()}</div>

            <hr/>
            <b>Items</b><br/>

            ${billItems
                .map(
                    (i) => `
                <div class="row">
                    <span>${i.name} (${i.variant}) x ${i.qty}</span>
                    <span>₹${(i.qty * i.price).toFixed(2)}</span>
                </div>
            `
                )
                .join("")}

            <hr/>
            <div class="row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
            <div class="row"><span>Discount</span><span>₹${discountAmount.toFixed(2)}</span></div>

            ${gstEnabled
                ? `
                <div class="row"><span>CGST 2.5%</span><span>₹${cgstAmount.toFixed(2)}</span></div>
                <div class="row"><span>SGST 2.5%</span><span>₹${sgstAmount.toFixed(2)}</span></div>
            `
                : ""
            }

            <hr/>
            <div class="row bold"><span>Grand Total</span><span>₹${grandTotal.toFixed(
                2
            )}</span></div>

            <hr/>
            <div class="center bold">Thank You! Visit Again</div>

            <script>
                setTimeout(() => {
                    window.print();
                    window.close();
                }, 200);
            </script>
        </body>
        </html>
    `;

        w.document.open();
        w.document.write(kotHtml);
        w.document.close();
    };

    const resetForm = () => {
        setCustomerName("");
        setCustomerNumber("");
        setTableNumber("");
        setBillItems([]);
        setDiscountInput(0);
        setDiscountPercent(0);
        setPaymentMethod("cash");
        setGstEnabled(true);
    };

    const saveBillToDB = async () => {
        try {
            const payload = {
                customerName,
                customerPhone: customerNumber,
                tableNumber,
                items: billItems.map((i) => ({
                    name: i.name,
                    variant: i.variant,
                    qty: i.qty,
                    price: i.price,
                    total: i.qty * i.price
                })),
                subtotal,
                discount: discountAmount,
                gst: cgstAmount + sgstAmount,
                finalAmount: grandTotal,
                paymentMethod
            };

            const res = await createManualRestaurantBillApi(payload);

            if (res.success) {

                // 🔹 Save bill metadata for printing
                setPrintedBillNumber(res.bill.billNumber);
                setPrintedBillDate(new Date(res.bill.createdAt).toLocaleString());

                toast.success(`Bill saved successfully! #${res.bill.billNumber}`);

                resetForm();
                return true;
            }
        } catch (err) {
            toast.error("Failed to save bill");
            return false;
        }
    };

    // Debounce wrapper (runs API only after 300ms pause)
    const debouncedSearch = debounce(async (value: string) => {
        if (value.trim() === "") {
            const items = await getMenuItemsApi();
            setMenuItems(items);
        } else {
            const items = await searchMenuItemsApi(value.trim());
            setMenuItems(items);
        }
    }, 300);


    const transferToRoom = async (room) => {
        const payload = {
            bookingId: room.booking._id,
            items: billItems.map(i => ({
                name: i.name,
                variant: i.variant.toUpperCase(),
                qty: i.qty,
                price: i.price,
                total: i.qty * i.price
            })),
            subtotal,
            discount: discountAmount,
            gst: cgstAmount + sgstAmount,
            finalAmount: grandTotal
        };

        const res = await transferRestaurantBillToRoomApi(payload);

        if (res.data.success) {
            toast.success(`Food bill transferred to Room ${room.number}`);
            resetForm();
            setOpenRoomTransfer(false);
        }

    };
    // INCREASE QTY
    const increaseQty = (id: string, variant: string) => {
        setBillItems(prev =>
            prev.map(i =>
                i._id === id && i.variant === variant
                    ? { ...i, qty: i.qty + 1 }
                    : i
            )
        );
    };

    // DECREASE QTY
    const decreaseQty = (id: string, variant: string) => {
        setBillItems(prev =>
            prev
                .map(i =>
                    i._id === id && i.variant === variant
                        ? { ...i, qty: i.qty - 1 }
                        : i
                )
                .filter(i => i.qty > 0) // auto-remove if qty = 0
        );
    };


    return (
        <Layout>
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => navigate("/billing")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    <h1 className="text-3xl font-bold">Create Restaurant Bill</h1>
                </div>


                {/* GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* MENU SECTION */}
                    <Card className="lg:col-span-2">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-semibold">Menu Items</h2>

                                <Input
                                    placeholder="Search menu..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSearchTerm(value);
                                        debouncedSearch(value);
                                    }}
                                    className="w-48"
                                />
                            </div>


                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {menuItems.map((item) => {
                                    const count = getItemCount(item._id);

                                    return (
                                        <div
                                            key={item._id}
                                            className="relative p-3 border rounded-lg hover:shadow space-y-2"
                                        >
                                            <p className="font-semibold">{item.name}</p>

                                            {/* COUNT BADGE */}
                                            {count > 0 && (
                                                <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full shadow">
                                                    {count} Added
                                                </div>
                                            )}

                                            {/* SINGLE */}
                                            {item.priceSingle ? (
                                                <Button
                                                    className="w-full"
                                                    variant="outline"
                                                    onClick={() =>
                                                        addToBill(item, "single", item.priceSingle)
                                                    }
                                                >
                                                    Single — ₹{item.priceSingle}
                                                </Button>
                                            ) : null}

                                            {/* HALF */}
                                            {item.priceHalf ? (
                                                <Button
                                                    className="w-full"
                                                    variant="outline"
                                                    onClick={() =>
                                                        addToBill(item, "half", item.priceHalf)
                                                    }
                                                >
                                                    Half — ₹{item.priceHalf}
                                                </Button>
                                            ) : null}

                                            {/* FULL */}
                                            {item.priceFull ? (
                                                <Button
                                                    className="w-full"
                                                    onClick={() =>
                                                        addToBill(item, "full", item.priceFull)
                                                    }
                                                >
                                                    Full — ₹{item.priceFull}
                                                </Button>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* BILL PREVIEW */}
                    <Card>
                        <CardContent className="p-4 space-y-4">

                            <h2 className="text-xl font-semibold">Bill Preview</h2>

                            <Input
                                placeholder="Customer Name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                            <Input
                                placeholder="Customer Number"
                                value={customerNumber}
                                onChange={(e) => setCustomerNumber(e.target.value)}
                            />
                            <Input
                                placeholder="Table Number"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                            />

                            {/* ADDED ITEMS */}
                            <div className="space-y-2 border rounded p-3">
                                {billItems.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No items added yet.</p>
                                )}

                                {billItems.map((i) => (
                                    <div
                                        key={i._id + i.variant}
                                        className="flex justify-between items-center"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {i.name} ({i.variant})
                                            </span>

                                            {/* QTY BUTTONS */}
                                            <div className="flex items-center gap-2 mt-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => decreaseQty(i._id, i.variant)}
                                                >
                                                    -
                                                </Button>

                                                <span className="px-2">{i.qty}</span>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => increaseQty(i._id, i.variant)}
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>

                                        {/* PRICE + DELETE */}
                                        <div className="flex items-center gap-2">
                                            <span>₹{(i.qty * i.price).toFixed(2)}</span>

                                            <Trash2
                                                size={18}
                                                className="text-red-500 cursor-pointer"
                                                onClick={() => removeFromBill(i._id, i.variant)}
                                            />
                                        </div>
                                    </div>
                                ))}

                            </div>

                            {/* DISCOUNT */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Discount (%)</label>

                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={discountInput}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "") setDiscountInput("");
                                            else setDiscountInput(Number(val));
                                        }}
                                    />

                                    <Button
                                        onClick={() => setDiscountPercent(Number(discountInput || 0))}
                                        className="whitespace-nowrap"
                                    >
                                        Apply
                                    </Button>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    Applied Discount: {discountPercent}% (₹{discountAmount.toFixed(2)})
                                </p>
                            </div>

                            {/* GST */}
                            <div className="flex items-center gap-2 mt-2">
                                <Checkbox
                                    checked={gstEnabled}
                                    onCheckedChange={() => setGstEnabled(!gstEnabled)}
                                />
                                <p className="text-sm">Apply GST (CGST 2.5% + SGST 2.5%)</p>
                            </div>

                            {/* PAYMENT METHOD */}
                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-medium">Payment Method</label>

                                <div className="flex flex-col gap-2">

                                    {["cash", "upi", "card", "other"].map((method) => (
                                        <label
                                            key={method}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <input
                                                type="radio"
                                                name="payment"
                                                value={method}
                                                checked={paymentMethod === method}
                                                onChange={() => setPaymentMethod(method)}
                                            />
                                            {method.toUpperCase()}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* TOTALS */}
                            <div className="text-sm space-y-1 pt-2">
                                <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
                                <p>Discount: -₹{discountAmount.toFixed(2)}</p>

                                {gstEnabled && (
                                    <>
                                        <p>CGST (2.5%): ₹{cgstAmount.toFixed(2)}</p>
                                        <p>SGST (2.5%): ₹{sgstAmount.toFixed(2)}</p>
                                    </>
                                )}

                                <p className="font-semibold text-lg pt-2">
                                    Grand Total: ₹{grandTotal.toFixed(2)}
                                </p>
                            </div>
                            <Button
                                className="w-full bg-yellow-600 hover:bg-yellow-700"
                                onClick={() => setOpenRoomTransfer(true)}
                            >
                                Transfer to Room Bill
                            </Button>


                            <Button
                                className="w-full"
                                onClick={async () => {
                                    const ok = await saveBillToDB();
                                    if (ok) printBill();
                                }}
                            >

                                <Printer className="mr-2" /> Print Bill
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* THERMAL PRINT TEMPLATE */}
                <div id="thermal-print" className="hidden">

                    {/* HOTEL HEADER */}
                    {hotel && (
                        <>
                            <div className="center bold">{hotel.name}</div>
                            {hotel.address && <div className="center">{hotel.address}</div>}
                            {hotel.phone && <div className="center">Ph: {hotel.phone}</div>}
                            {hotel.gstNumber && <div className="center">GSTIN: {hotel.gstNumber}</div>}
                            <div className="line"></div>
                        </>
                    )}

                    {/* BILL NUMBER + DATE */}
                    <p>Bill No: {printedBillNumber}</p>
                    <p>Date: {printedBillDate}</p>

                    <div className="line"></div>

                    <div className="center bold">RESTAURANT BILL</div>
                    <div className="line"></div>

                    <p>Customer: {customerName}</p>
                    <p>Mobile: {customerNumber}</p>
                    <p>Table: {tableNumber}</p>
                    <p>Payment Method: {paymentMethod.toUpperCase()}</p>

                    <div className="line"></div>

                    {billItems.map((i) => (
                        <p key={i._id + i.variant}>
                            {i.name} ({i.variant}) × {i.qty} — ₹{(i.qty * i.price).toFixed(2)}
                        </p>
                    ))}

                    <div className="line"></div>

                    <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
                    <p>Discount: ₹{discountAmount.toFixed(2)}</p>

                    {gstEnabled ? (
                        <>
                            <p>CGST: ₹{cgstAmount.toFixed(2)}</p>
                            <p>SGST: ₹{sgstAmount.toFixed(2)}</p>
                        </>
                    ) : null}

                    <p className="bold">Grand Total: ₹{grandTotal.toFixed(2)}</p>

                    <div className="center">Thank You! Visit Again</div>
                </div>

            </div>
            {openRoomTransfer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">

                        <h2 className="text-xl font-bold">Select Room</h2>

                        {roomsToday.length === 0 ? (
                            <p className="text-muted-foreground">No occupied rooms today</p>
                        ) : (
                            roomsToday.map(r => (
                                <button
                                    key={r._id}
                                    className="w-full p-3 border rounded-lg text-left hover:bg-gray-100"
                                    onClick={() => {
                                        if (!r.booking) {
                                            toast.error("No active booking found");
                                            return;
                                        }
                                        transferToRoom(r);
                                    }}

                                >
                                    <div className="font-semibold">Room {r.number}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {r.booking?.guestName || "Guest"}
                                    </div>
                                </button>
                            ))
                        )}

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setOpenRoomTransfer(false)}
                        >
                            Cancel
                        </Button>

                    </div>
                </div>
            )}

        </Layout>
    );
}

