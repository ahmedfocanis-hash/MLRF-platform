import { ZodError } from 'zod';
import multer from 'multer';
import type { Request,Response,NextFunction } from 'express';
export class AppError extends Error {constructor(public statusCode:number,public code:string,message:string,public details?:unknown){super(message);this.name='AppError';}}
export const asyncHandler=(fn:(req:Request,res:Response,next:NextFunction)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>Promise.resolve(fn(req,res,next)).catch(next);
export function errorHandler(error:unknown,_req:Request,res:Response,_next:NextFunction){const e=error instanceof AppError?error:error instanceof ZodError?new AppError(400,'VALIDATION_ERROR','Request validation failed',error.flatten()):error instanceof multer.MulterError?new AppError(400,'UPLOAD_ERROR',error.code==='LIMIT_FILE_SIZE'?'File exceeds the 5 MB limit':'File upload was rejected',{code:error.code}):new AppError(500,'INTERNAL_ERROR','An unexpected error occurred');if(e.statusCode>=500) console.error(error);res.status(e.statusCode).json({success:false,data:null,error:{code:e.code,message:e.message,...(e.details===undefined?{}:{details:e.details})}});}
export function ok<T>(res:Response,data:T,status=200){return res.status(status).json({success:true,data,error:null});}
