import puppeteer from 'puppeteer'
import axios from 'axios'
import * as cheerio from "cheerio";

export async function aseo_ecom(rol,dv){
  // Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  })

  const page = await browser.newPage()
  await page.deleteCookie();

  const url='https://ww6.e-com.cl/Pagos/DerechodeAseo/onlinev4/inicio.asp?codMunic=47'
  const url_cookie1='https://ww6.e-com.cl/Pagos/DerechodeAseo/onlinev4/detalle_aseo.asp'
  const url_cookie2='https://ww6.e-com.cl/Pagos/DerechodeAseo/onlinev4/inicio.asp?codMunic=47'

  try{

  await page.goto(url,{timeout:5000})
  await page.waitForSelector('#button1',{timeout:3000})
  await page.type('#manzana',rol)
  await page.type('#predio',dv)
  await page.click('#button1')

  await page.waitForSelector(`td:nth-child(7)`,{timeout:3000})

 
  // Get cookies for axios
  let cookies= await page.cookies()
  cookies= cookies[1].name+"="+cookies[1].value+"; derecho%5Faseo="+cookies[0].value

  
  const response = await axios.get(url_cookie1, {
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'es-ES,es;q=0.9',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
    'Cookie': `${cookies}`,
    'Referer': url_cookie2,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
  }
});

 const $ = cheerio.load(response.data)
 let amount=0
 let total=0
  $('td:nth-child(7)').each((index, element) => {
    if(index>0 && index<$('td:nth-child(7)').length-1){
      amount=parseInt($(element).text().replace('.',''))
      total+=amount
    }
  }) 

  await browser.close();
  if (total >= 0) {
    return {data:{
      total_debt_amount: total,
    }};
  } else {
    return {data:{
      total_debt_amount: "Sin deuda/No registrado",
    }};
  }

  } catch (error){
    await browser.close();
    return {data:{
      total_debt_amount: "Sin deuda/No registrado",
    }};
  }

}

export default aseo_ecom