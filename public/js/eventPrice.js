const basePrices = {
    Wedding: 3000,      
    Birthday: 1000,
    Corporate: 2500,
    Concert: 4000,
    Other: 2000
  };

  const guestMultiplier = {
    "100": 1,
    "200": 1.1,
    "300": 1.2,
    "400": 1.3,
    "500": 1.4,
    "other+": 1.5
  };

  const decorationMultiplier = {
    Standard: 1,
    High: 1.2,
    Luxury: 1.5
  };

  function calculatePrice() {
    const eventType = document.getElementById("eventType").value;
    const numPersons = parseInt(document.getElementById("numPersons").value);
    const decoration = document.getElementById("decoration").value;

    if (eventType && numPersons && decoration) {
      const basePrice = basePrices[eventType] || 2000;
      let guestRange = "100";
      if (numPersons > 100 && numPersons <= 200) guestRange = "200";
      else if (numPersons > 200 && numPersons <= 300) guestRange = "300";
      else if (numPersons > 300 && numPersons <= 400) guestRange = "400";
      else if (numPersons > 400 && numPersons <= 500) guestRange = "500";
      else if (numPersons > 500) guestRange = "other";

      const guestMulti = guestMultiplier[guestRange] || 1;
      const decoMulti = decorationMultiplier[decoration] || 1;

      const totalPrice = Math.round(basePrice * numPersons * guestMulti * decoMulti);
      document.getElementById("priceDisplay").innerText = `Estimated Total Price: PKR ${totalPrice.toLocaleString()}`;
      document.getElementById("price").value = totalPrice;
    } else {
      document.getElementById("priceDisplay").innerText = "Estimated Total Price: PKR 0";
    }
  }

  document.getElementById("eventType").addEventListener("change", calculatePrice);
  document.getElementById("numPersons").addEventListener("input", calculatePrice);
  document.getElementById("decoration").addEventListener("change", calculatePrice);


  window.addEventListener("DOMContentLoaded", calculatePrice);