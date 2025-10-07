BX24.init(() => {
  const segmentSelect = document.getElementById("segmentSelect");
  const startCallsBtn = document.getElementById("startCalls");

  // Fetch segments from Bitrix24
  BX24.callMethod("crm.segment.list", {}, (result) => {
    if (result.error()) {
      alert(`Error fetching segments: ${result.error()}`);
      segmentSelect.innerHTML =
        '<option value="">Error loading segments</option>';
      return;
    }

    const segments = result.data() || [];
    if (segments.length === 0) {
      segmentSelect.innerHTML = '<option value="">No segments found</option>';
      return;
    }

    // Populate select dropdown
    segmentSelect.innerHTML = '<option value="">--Select Segment--</option>';
    segments.forEach((seg) => {
      const opt = document.createElement("option");
      opt.value = seg.ID;
      opt.textContent = seg.NAME;
      segmentSelect.appendChild(opt);
    });

    startCallsBtn.disabled = false;
  });

  // Handle bulk call button click
  startCallsBtn.addEventListener("click", async () => {
    const segmentId = segmentSelect.value;
    if (!segmentId) {
      alert("Please select a segment first!");
      return;
    }

    try {
      const result = await new Promise((resolve, reject) => {
        BX24.callMethod(
          "crm.contact.list",
          {
            filter: { SEGMENT_ID: segmentId },
            select: ["ID", "NAME", "PHONE"],
          },
          (res) => {
            res.error() ? reject(res.error()) : resolve(res.data());
          }
        );
      });

      if (!result || result.length === 0) {
        alert("No contacts found in this segment.");
        return;
      }

      const phoneNumbers = result
        .map((c) => c.PHONE?.[0]?.VALUE)
        .filter(Boolean);

      if (phoneNumbers.length === 0) {
        alert("No phone numbers found in this segment.");
        return;
      }

      // Send phone numbers to backend
      const response = await fetch(
        "https://your-backend.com/api/bland-ai/call",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumbers }),
        }
      );

      if (!response.ok) throw new Error("Failed to send data to backend");

      alert("Bulk call started successfully!");
    } catch (err) {
      alert(`Error: ${err}`);
    }
  });
});
