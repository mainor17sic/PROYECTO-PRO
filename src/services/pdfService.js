/**
 * Servicio encargado de la generación estética del PDF
 * Separa la lógica de diseño de la interfaz de usuario.
 */
export const generarRecibo = (p) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    
    // --- 1. FONDO ELEGANTE ---
    doc.setFillColor(252, 251, 247); 
    doc.rect(0, 0, 210, 297, 'F');

    // --- 2. MARCA DE AGUA ---
    doc.setTextColor(240, 235, 220); 
    doc.setFontSize(100);
    doc.setFont("helvetica", "bold");
    doc.text("PAN", 105, 150, { align: "center", angle: 45 });

    // --- 3. BORDE DECORATIVO ---
    doc.setDrawColor(230, 220, 200);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287);

    // --- 4. ENCABEZADO AZUL PROFESIONAL ---
    doc.setFillColor(37, 99, 235); 
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("PANADERÍA MARVIN", 105, 25, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.text("Calidad y Sabor en cada Pedido", 105, 33, { align: "center" });

    // --- 5. DETALLES DEL CLIENTE ---
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DEL PEDIDO", 20, 60);
    
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.8);
    doc.line(20, 62, 70, 62);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`CLIENTE:`, 20, 72);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${p.cliente.toUpperCase()}`, 45, 72);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`FECHA:`, 20, 78);
    doc.text(`${p.fecha}`, 45, 78);

    doc.text(`NOTA:`, 20, 84);
    doc.setFont("helvetica", "italic");
    doc.text(`${p.nota || "Sin observaciones adicionales"}`, 45, 84);

    // --- 6. TABLA DE PRODUCTOS ---
    let y = 100;
    doc.setFillColor(241, 245, 249);
    doc.rect(20, y, 170, 10, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("PRODUCTO", 25, y + 7);
    doc.text("CANT.", 100, y + 7);
    doc.text("PRECIO", 140, y + 7);
    doc.text("SUBTOTAL", 185, y + 7, { align: "right" });
    
    y += 18;
    let totalGral = 0;
    
    p.items.forEach((it) => {
        const sub = it.cantidad * it.precio;
        totalGral += sub;
        
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.1);
        doc.line(20, y + 2, 190, y + 2);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(`${it.nombre}`, 25, y);
        doc.text(`${it.cantidad}`, 105, y, { align: "center" });
        doc.text(`Q${it.precio.toFixed(2)}`, 140, y);
        doc.setFont("helvetica", "bold");
        doc.text(`Q${sub.toFixed(2)}`, 185, y, { align: "right" });
        y += 9;
    });

    // --- 7. RECUADRO DE TOTAL ---
    y += 10;
    doc.setFillColor(37, 99, 235);
    doc.rect(130, y, 60, 15, 'F'); 
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: Q${totalGral.toFixed(2)}`, 185, y + 10, { align: "right" });

    // --- 8. PIE DE PÁGINA ---
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text("Este documento es un comprobante de venta de Panadería Marvin.", 105, 275, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text("¡Gracias por su preferencia!", 105, 280, { align: "center" });

    // Descarga automática
    doc.save(`Recibo_premium_${p.cliente.replace(/\s+/g, '_')}.pdf`);
};
