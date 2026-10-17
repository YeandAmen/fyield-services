export class InputError extends Error { constructor(message,status=400){super(message);this.status=status;} }
export const categories=['Nannies','Cleaning','Mechanics','Hair & beauty','Skilled hands'];
export const areas=['Maitama','Gwarinpa','Wuse','Garki','Jabi','Asokoro','Kubwa','Lokogoma','Lugbe','Utako','Jahi','Other Abuja area'];
export function text(value,name,min,max){if(typeof value!=='string')throw new InputError(`${name} is required.`);const s=value.trim();if(s.length<min||s.length>max)throw new InputError(`${name} must be ${min}–${max} characters.`);return s;}
export function profileInput(body){
 const name=text(body.name,'Display name',2,70), title=text(body.title,'Service headline',8,100),about=text(body.about,'About your service',40,2000);
 if(!categories.includes(body.category)||!areas.includes(body.area))throw new InputError('Choose a valid service and Abuja area.');
 const price=Number(body.price);if(!Number.isInteger(price)||price<100||price>10000000)throw new InputError('Enter a price between ₦100 and ₦10,000,000.');
 if(!['hour','day','visit','session','service','job'].includes(body.unit))throw new InputError('Choose a pricing unit.');
 const skills=body.skills;if(!Array.isArray(skills)||skills.length<1||skills.length>8)throw new InputError('Add 1–8 services.');
 const cleanSkills=[...new Set(skills.map(s=>text(s,'Service',2,45)))];
 if(!Array.isArray(body.photos)||body.photos.length>6)throw new InputError('You can add up to six work photos.');
 const photos=body.photos.map(p=>({id:text(p.id,'Photo ID',36,36),caption:text(p.caption,'Work caption',8,180)}));
 if(new Set(photos.map(p=>p.id)).size!==photos.length)throw new InputError('Each photo can appear only once.');
 const experience=Number(body.experience);if(!Number.isInteger(experience)||experience<0||experience>60)throw new InputError('Enter 0–60 years of experience.');
 if(body.consent!==true)throw new InputError('Confirm that these public details and photos are yours to share.');
 return {name,title,about,category:body.category,area:body.area,price,unit:body.unit,skills:cleanSkills,photos,experience,location:'Abuja'};
}
export function reviewInput(body){const rating=Number(body.rating);if(!Number.isInteger(rating)||rating<1||rating>5)throw new InputError('Choose 1–5 stars.');if(body.confirmed!==true)throw new InputError('Confirm that you personally used this service.');return {rating,comment:text(body.comment,'Your review',20,1200)};}
