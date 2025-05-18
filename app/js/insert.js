function resetButtonStyles() {
  $("footer .nav button").css({
    "background-color": "",
    color: "",
  });
}

function loadHomepage() {
  const balanceEndpoint = "getTotalBalance.php";
  const tradesEndpoint = "getTradesData.php";

  // Fetch balance and trades data concurrently
  $.when(
    $.ajax({ url: balanceEndpoint, method: "GET" }),
    $.ajax({ url: tradesEndpoint, method: "GET" })
  )
    .done(function (balanceResponse, tradesResponse) {
      const balance = balanceResponse[0]?.total_balance || 0; // Extract balance
      const trades = tradesResponse[0] || []; // Extract trades data

      // Build the HTML
      const balanceHtml = `
      <div id="current_balance">
        <h3 id="update_balance">Total<br>¥${Number(
          balance
        ).toLocaleString()}</h3>
      </div>
    `;

      let tradesHtml = `
      <table>
        <tr>
          <th>Date</th>
          <th>FX/CFD</th>
          <th>Risk</th>
          <th>Amount</th>
        </tr>
    `;

      if (trades.length > 0) {
        trades.forEach((trade) => {
          const date = new Date(trade.date).toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            weekday: "short",
          });
          const risk = `${parseFloat(trade.risk).toFixed(2)}%`;
          const amount = `¥${Number(trade.amount).toLocaleString()}`;
          const amountStyle = trade.is_win ? "" : "style='color: red;'";

          tradesHtml += `
          <tr onclick="getTradeDetail(${trade.id})">
            <td>${date}</td>
            <td>${trade.currency_pair}</td>
            <td>${risk}</td>
            <td ${amountStyle}>${trade.is_win ? amount : `- ${amount}`}</td>
          </tr>
        `;
        });
      } else {
        tradesHtml += `
        <tr>
          <td>*</td>
          <td>No Data</td>
          <td>found</td>
          <td>*</td>
        </tr>
      `;
      }

      tradesHtml += "</table>";

      // Inject the HTML into the container
      $("#container").html(balanceHtml + tradesHtml);

      // Call additional UI updates
      resetButtonStyles();
      $("footer .nav button:nth-child(1)").css({
        "background-color": "#697565",
        color: "#181C14",
      });
    })
    .fail(function () {
      $("#container").html(
        "<p>Error loading data. Please try again later.</p>"
      );
    });
}

function getTradeDetail(trade_id) {
  $.ajax({
    url: "trade_detail.php",
    method: "GET",
    data: { trade_id: trade_id },
    dataType: "json",
    success: function (data) {
      if (!data || data.error) {
        $.alert({
          title: "Error!",
          content: data.error || "Failed to fetch trade details.",
          type: "red",
        });
        return;
      }
      console.log(data);
      let trader = "Season";
      if (data.uid == 2) {
        trader = "Reason";
      }
      let type = "red";
      let trade_result = "Loss";
      if (data.is_win == true) {
        type = "green";
        trade_result = "Win";
      }
      // Construct content for the dialog
      const dialogContent = `
        <h2>Trader : ${trader} (${trade_result})<h2>
        <p><strong>Currency Pair : </strong> ${data.currency_pair}</p>
        <p><strong>Risk : </strong> ${data.risk}%</p>
        <p><strong>Amount : </strong> ¥${data.amount.toLocaleString()}</p>
        <p><strong>Description : </strong> ${data.description}</p>
        <p><strong>Date : </strong> ${new Date(
          data.date
        ).toLocaleDateString()}</p>
      `;

      // Open the jQuery Confirm dialog
      $.confirm({
        title: `Trade Details`,
        content: dialogContent,
        theme: "dark",
        type: type,
        buttons: {
          delete: {
            text: "Delete",
            btnClass: "btn-red",
            action: function () {
              // Confirm delete
              $.confirm({
                title: "Confirm Deletion",
                content: "Are you sure you want to delete this trade?",
                theme: "dark",
                type: "red",
                buttons: {
                  confirm: {
                    text: "Yes, Delete",
                    btnClass: "btn-red",
                    action: function () {
                      $.ajax({
                        url: "delete.php",
                        method: "POST",
                        data: { id: trade_id },
                        dataType: "json",
                        success: function (response) {
                          if (response.status === "success") {
                            $.alert({
                              title: "Success!",
                              theme: "dark",
                              content: response.message,
                              type: "green",
                              onClose: function () {
                                // Reload the page or table after deletion
                                loadHomepage();
                              },
                            });
                          } else {
                            $.alert({
                              title: "Error!",
                              theme: "dark",
                              content: response.message,
                              type: "red",
                            });
                          }
                        },
                        error: function () {
                          $.alert({
                            title: "Error!",
                            content:
                              "An error occurred while deleting the trade.",
                            type: "red",
                          });
                        },
                      });
                    },
                  },
                  cancel: {
                    text: "Cancel",
                    btnClass: "btn-blue",
                  },
                },
              });
            },
          },
          close: {
            text: "Close",
            btnClass: "btn-blue",
          },
        },
      });
    },
    error: function () {
      $.alert({
        title: "Error!",
        content: "An error occurred while fetching trade details.",
        type: "red",
      });
    },
  });
}

let lineChartInstance = null; // To keep track of the line chart instance

function renderLineChart(data) {
  // Clear the container and previous chart instance
  $("#container").empty();
  if (lineChartInstance) {
    lineChartInstance.destroy();
  }

  // Create a div for the line chart
  const lineChartDiv = $("<div>")
    .attr("id", "lineChartContainer")
    .css({ marginTop: "20px", width: "100%", height: "350px" })
    .appendTo("#container");

  // Create the canvas element dynamically
  const canvas = $("<canvas>").attr("id", "myLineChart").appendTo(lineChartDiv);

  // Get the canvas context for Chart.js
  const ctx = canvas[0].getContext("2d");

  // Parse dates and values
  const parsedData = data.map((d) => ({
    date: new Date(d.date),
    amount: +d.current_amount,
  }));

  // Extract labels (dates) and data (amounts)
  const labels = parsedData.map((d) => d.date.toLocaleDateString());
  const amounts = parsedData.map((d) => d.amount);

  // Create the line chart and store the instance
  lineChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Amount ($)",
          data: amounts,
          borderColor: "steelblue",
          borderWidth: 1.5,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "category",
          ticks: {
            autoSkip: true,
            maxTicksLimit: 10,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
    },
  });
}

function renderPieChart(data) {
  // Add a container for the pie chart after the line chart
  const pieChartDiv = $("<div>")
    .attr("id", "pieChartContainer")
    .css({ marginTop: "50px" })
    .appendTo("#container");

  const pieCanvas = $("<canvas>")
    .attr("id", "myPieChart")
    .attr("width", "350")
    .attr("height", "350")
    .appendTo(pieChartDiv);

  // Prepare data for the pie chart
  const labels = data.map((item) => item.currency_pair);
  const values = data.map((item) => item.total_amount);

  // Add more background color variations
  const backgroundColors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#E57373",
    "#64B5F6",
    "#FFD54F",
    "#4DB6AC",
    "#BA68C8",
    "#FFA726",
    "#DCE775",
    "#81C784",
    "#90A4AE",
    "#F06292",
    "#7986CB",
    "#A1887F",
  ];

  // Render the pie chart
  const ctx = document.getElementById("myPieChart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: backgroundColors.slice(0, values.length),
        },
      ],
    },
    options: {
      responsive: true,
    },
  });
}

function addTradeConfirm() {
  $.confirm({
    title: "Submit New Trade",
    theme: "dark",
    content:
      "" +
      '<form id="tradeForm" method="post">' +
      '<div id="currency_pair_selects"></div>' +
      '<label for="uid">Trader</label>' +
      '<select name="cars" id="uid">' +
      '<option value="1">Season</option>' +
      '<option value="2">Reason</option>' +
      "</select>" +
      '<label for="risk">Risk</label>' +
      '<div id="range"><input type="range" id="risk" name="risk" min="1" max="10" step="0.5" value="1" required />' +
      '<span id="riskValue">1</span></div>' +
      "<label>P&L</label>" +
      '<div id="pl">' +
      '<input type="radio" name="is_win" value="1" required id="win">' +
      '<label for="win">Win</label>' +
      '<input type="radio" name="is_win" value="0" id="loss">' +
      '<label for="loss">Loss</label>' +
      "</div>" +
      '<label for="description">Description</label>' +
      '<textarea id="description" name="description"></textarea>' +
      '<label for="amount">Amount</label>' +
      '<input type="number" type="number" min="0" inputmode="numeric" pattern="[0-9]*" title="Non-negative integral number" id="amount" name="amount" required />' +
      '<label for="date">Trade Date</label>' +
      '<input type="date" id="date" name="date" required />' +
      "</form>",
    buttons: {
      submit: {
        text: "Submit",
        btnClass: "btn-blue",
        action: function () {
          const formData = {
            currency_pair:
              this.$content.find("#currency_select_1").val() +
              "/" +
              this.$content.find("#currency_select_2").val(),
            risk: this.$content.find("#risk").val(),
            is_win: this.$content.find("input[name='is_win']:checked").val(),
            description: this.$content.find("#description").val(),
            date: this.$content.find("#date").val(),
            amount: this.$content.find("#amount").val(),
            uid: this.$content.find("#uid").val(),
          };

          // Validate that both selects are filled and not the same
          if (
            !formData.currency_pair ||
            this.$content.find("#currency_select_1").val() ===
              this.$content.find("#currency_select_2").val() ||
            !formData.risk ||
            !formData.is_win ||
            !formData.description ||
            !formData.date ||
            !formData.amount
          ) {
            $.alert(
              "Please select two different currencies and fill out all fields."
            );
            return false;
          }

          // AJAX request
          $.ajax({
            url: "insert.php", // Replace with your actual PHP file
            type: "POST",
            data: formData,
            dataType: "json",
            success: function (response) {
              if (response.status === "success") {
                $.alert(response.message);
                $("#tradeForm")[0].reset();
                loadHomepage(); // Call loadHomepage after successful insert
              } else {
                $.alert("Error: " + response.message);
              }
            },
            error: function (xhr, status, error) {
              console.error("AJAX Error:", error);
              console.log(formData);
              $.alert("An unexpected error occurred. Please try again.");
            },
          });
        },
      },
      cancel: {
        text: "Cancel",
        btnClass: "btn-red",
        action: function () {
          //
        },
      },
    },
    onContentReady: function () {
      const currencies = [
        "AUD",
        "GBP",
        "USD",
        "CAD",
        "HKD",
        "CHF",
        "JPY",
        "EUR",
        "NZD",
        "PLN",
      ];

      let currencyOptions = currencies
        .map((currency) => `<option value="${currency}">${currency}</option>`)
        .join("");

      this.$content.find("#currency_pair_selects").html(`
        <label for="currency_select_1">Currency Pair</label>
        <div>
          <select id="currency_select_1" name="currency_select_1" required>
            <option value="" selected>Choose Currency</option>
            ${currencyOptions}
          </select>
          <span>/</span>
          <select id="currency_select_2" name="currency_select_2" required>
            <option value="" selected>Choose Currency</option>
            ${currencyOptions}
          </select>
        </div>
      `);
    },
  });
}

function update_balance(params) {
  // Show the balance input form
  $.confirm({
    title: "Set New Current <br>Balance",
    theme: "dark",
    content:
      "" +
      '<form action="" class="formName">' +
      '<div class="balance_form">' +
      '<label for="newBalance">Balance</label>' +
      '<input type="number" min="0" inputmode="numeric" pattern="[0-9]*" title="Non-negative integral number" id="newBalance" class="form-control" placeholder="Enter balance" required />' +
      "</div>" +
      "</form>",
    buttons: {
      submit: {
        text: "Submit",
        btnClass: "btn-blue",
        action: function () {
          const newBalance = this.$content.find("#newBalance").val();

          // Validate the balance input
          if (newBalance === "" || isNaN(newBalance)) {
            $.alert("Please enter a valid balance.");
            return false;
          }

          // Send AJAX request to update the balance
          $.ajax({
            url: "set_balance.php", // Replace with your PHP file
            type: "POST",
            data: { account_name: "oanda", current_balance: newBalance },
            success: function (response) {
              try {
                const result = JSON.parse(response);
                if (result.status === "success") {
                  $.alert("Balance updated successfully!");
                  loadHomepage();
                } else {
                  $.alert("Error: " + result.message);
                }
              } catch (e) {
                $.alert("Unexpected error occurred.");
                console.error(e);
              }
              loadHomepage();
            },
            error: function (xhr, status, error) {
              $.alert("Failed to update balance. Please try again.");
              console.error("AJAX Error:", error);
            },
          });
        },
      },
      cancel: {
        text: "Cancel",
        btnClass: "btn-red",
        action: function () {
          console.log("User canceled the action.");
        },
      },
    },
    onContentReady: function () {
      var jc = this;
      this.$content.find("form").on("submit", function (e) {
        e.preventDefault();
        jc.$$submit.trigger("click");
      });
    },
  });
}

$(document).ready(function () {
  // Debounce function to optimize loadHomepage
  function debounceLoadHomepage() {
    clearTimeout();
    loadTimer = setTimeout(function () {
      loadHomepage();
    }, 300); // Delay by 300ms before executing
  }

  // Resize event handler
  $(window).resize(function () {
    debounceLoadHomepage();
  });

  document.addEventListener("input", function (event) {
    if (event.target.id === "risk") {
      document.getElementById("riskValue").textContent = event.target.value;
    }
  });

  $("#addtrade").click(function () {
    addTradeConfirm();
  });

  $("#homepage").on("click", function () {
    loadHomepage();
  });

  $("#graphpage").on("click", function () {
    // Update styles for the second button
    resetButtonStyles();
    $("footer .nav button:nth-child(2)").css({
      "background-color": "#697565",
      color: "#181C14",
    });

    // Fetch data and render the charts
    $.ajax({
      url: "graph_data.php",
      method: "GET",
      dataType: "json",
      success: function (data) {
        if (!Array.isArray(data) || data.length === 0) {
          $("#container").html("<p>No data available for the graph.</p>");
          return;
        }
        // Render the line chart first
        renderLineChart(data);

        // Fetch data for the pie chart after rendering the line graph
        $.ajax({
          url: "pie_graph.php",
          method: "GET",
          dataType: "json",
          success: function (pieData) {
            if (!Array.isArray(pieData) || pieData.length === 0) {
              $("#container").append(
                "<p>No data available for the pie chart.</p>"
              );
              return;
            }
            // Render the pie chart after the line chart
            renderPieChart(pieData);
          },
          error: function () {
            $("#container").append("<p>Error loading pie chart data.</p>");
          },
        });
      },
      error: function () {
        $("#container").html("<p>Error loading graph data.</p>");
      },
    });
  });

  // update account balance
  $(document).on("click", "#update_balance", function () {
    update_balance();
  });

  loadHomepage(); // Initial load on page load
});
