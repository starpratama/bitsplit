$(document).ready(function() {
    // Split logo animation
    $(".navbar-brand").on("mouseover", function() {
        $("#logo_split").html("&nbsp;");
        $("#logo_split2").html("");
      });
    $(".navbar-brand").on("mouseout", function() {
        $("#logo_split").html("");
        $("#logo_split2").html("&nbsp;");
      });
});

function refresh_current_stats(current_stats)
{
    var table_id = "#current_contenders table tbody";
    $(table_id).html("");

    var current_winning_contribution = 0;
    if(current_stats.contributors[0]) {
        current_winning_contribution = current_stats.contributors[0].contribution;
    }
    $("#current-winning-contribution").html("<i class='fa fa-btc'></i>"+to_btc(current_winning_contribution));
    $("#jackpot-amount").html("<i class='fa fa-btc'></i>"+to_btc(current_stats.jackpot));
    $("#prize-amount").html("<i class='fa fa-btc'></i>"+to_btc(current_stats.prize));

    for(var ii = 0; ii < current_stats.contributors.length && ii < 10; ii++)
    {
        var font_color = "bitcoin-symbol font-color-bitcoin";

        var contributor          = current_stats.contributors[ii];
        var percent_contribution = contributor.percent.total_contribution * 100;
        var percent_win_chance   = contributor.percent.win_chance * 100;

        var font_odds   = "font-color-bitcoin-lose";
        var odds_symbol = "<";
        if(percent_win_chance > percent_contribution) {
            font_odds   = "font-color-bitcoin-win";
            odds_symbol = ">";
        }
        else if(percent_win_chance === percent_contribution) {
            font_odds   = "font-color-bitcoin-neutral";
            odds_symbol = "=";
        }

        var str  = "<tr>";
        str     += "<td>"+current_stats.contributors[ii].user_id+"</td>";
        str     += "<td class='"+font_color+" font-weight-heavy'>"+to_btc(current_stats.contributors[ii].contribution)+"</td>";
        str     += "<td class='percentage-symbol "+font_odds+"'>"+percent_win_chance.toPrecision(3)+"</td>";
        str     += "<td>"+odds_symbol+"</td>";
        str     += "<td class='percentage-symbol "+font_odds+"'>"+percent_contribution.toPrecision(3)+"</td>";
        str     += "</tr>";

        $(table_id).append(str);
    }
}

function refresh_past_winners(past_winners)
{
    var table_id = "#past_winners table tbody";
    $(table_id).html("");

    for(var ii = 0; ii < past_winners.length && ii < 10; ii++)
    {
        var str  = "<tr>";
        str     += "<td>"+past_winners[ii].user_id+"</td>";
        str     += "<td class='bitcoin-symbol font-color-bitcoin-neutral'>"+to_btc(past_winners[ii].contribution)+"</td>";
        str     += "<td class='bitcoin-symbol font-color-bitcoin-win'>"+to_btc(past_winners[ii].payout)+"</td>";
        str     += "</tr>";

        $(table_id).append(str);
    }
}

function refresh_config(config_data) {
    console.log(config_data);
    if(typeof config_data.split_n_minutes !== "undefined") {
        $(".split-time-minutes").html(config_data.split_n_minutes);
    }
}

function to_btc(satoshis) {
    return satoshis/Math.pow(10,8);
}
function to_satoshis(btc) {
    return btc*Math.pow(10,8);
}
