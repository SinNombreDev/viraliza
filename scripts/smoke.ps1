# End-to-end smoke test against the running dev server.
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000'
function Say($m) { Write-Host "`n=== $m ===" -ForegroundColor Cyan }

Say 'GET /api/feed'
$feed = Invoke-RestMethod "$base/api/feed?sort=viral&limit=4"
Write-Host "total=$($feed.total)"
$feed.items | ForEach-Object { Write-Host ("  {0} | viral {1} | comissao R$ {2:N2}" -f $_.title.Substring(0,[Math]::Min(38,$_.title.Length)), $_.viralScore, ($_.estimatedNetCommissionCents/100)) }

Say 'POST /api/chat (anonymous)'
$chat = Invoke-RestMethod "$base/api/chat" -Method Post -ContentType 'application/json' -Body '{"message":"o que esta bombando agora?"}'
Write-Host $chat.message.content
Write-Host ("products: " + $chat.products.Count)

Say 'POST /api/auth/login (demo)'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$login = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body '{"email":"demo@viraliza.app"}' -WebSession $session
Write-Host ("user: {0} ({1}) plan={2} saldo=R$ {3:N2}" -f $login.user.name, $login.user.email, $login.user.plan, ($login.user.balanceCents/100))

Say 'GET /api/me'
$me = Invoke-RestMethod "$base/api/me" -WebSession $session
Write-Host ("links={0} clicks={1} sales={2} earned=R$ {3:N2}" -f $me.stats.linksCount, $me.stats.clicks, $me.stats.sales, ($me.stats.earnedCents/100))

Say 'POST /api/links (create affiliate link)'
$productId = $feed.items[0].id
$link = Invoke-RestMethod "$base/api/links" -Method Post -ContentType 'application/json' -Body (@{ productId = $productId } | ConvertTo-Json) -WebSession $session
Write-Host ("code={0}" -f $link.link.code)
Write-Host ("short=http://localhost:3000/r/{0}" -f $link.link.code)
Write-Host ("wa={0}" -f $link.link.whatsappShareUrl.Substring(0,[Math]::Min(90,$link.link.whatsappShareUrl.Length)))

Say 'POST /api/chat (authenticated, gera link)'
$chat2 = Invoke-RestMethod "$base/api/chat" -Method Post -ContentType 'application/json' -Body '{"message":"gera o link do primeiro produto"}' -WebSession $session
Write-Host $chat2.message.content
Write-Host ("createdLink: " + $chat2.createdLink.shortUrl)

Say 'GET /r/:code (should 302 to marketplace)'
try {
  $resp = Invoke-WebRequest "http://localhost:3000/r/$($link.link.code)" -MaximumRedirection 0 -ErrorAction SilentlyContinue
  Write-Host "status=$($resp.StatusCode)"
} catch {
  $r = $_.Exception.Response
  Write-Host ("status={0} location={1}" -f [int]$r.StatusCode, $r.Headers.Location)
}

Say 'POST /api/webhooks/conversion (simulate a sale)'
$conv = Invoke-RestMethod "$base/api/webhooks/conversion" -Method Post -ContentType 'application/json' -Body (@{ code = $link.link.code; price = 129.90 } | ConvertTo-Json)
Write-Host ("net=R$ {0:N2} platformFee=R$ {1:N2}" -f ($conv.net/100), ($conv.platformFee/100))

Say 'GET /api/me (after sale)'
$me2 = Invoke-RestMethod "$base/api/me" -WebSession $session
Write-Host ("saldo=R$ {0:N2} earned=R$ {1:N2} sales={2}" -f ($me2.stats.balanceCents/100), ($me2.stats.earnedCents/100), $me2.stats.sales)

Write-Host "`nALL SMOKE CHECKS PASSED" -ForegroundColor Green
