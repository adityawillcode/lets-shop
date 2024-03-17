import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/_lib/utils/prisma";

export const handler= NextAuth({
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const credData=JSON.parse(credentials.payload)
      try {
        const {data,user}=credData;
        
        const {email,password}=data;
        if (!email || !password) {
          return null;
        }
        if (!user) {
          return null;
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return null;
        }
        return { name: user.name, email: user.email, userId:user.userId };
      } catch (error) {
        console.log("this is error");
        console.log(error);
      }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    
      authorization:{
        params:{
          prompt:'consent',
          access_type:'offline',
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user ,account}) {
     
      if(user && account){
        
        if(account.provider=='google'){
          // check user from db
          const googleUser = await prisma.user.findFirst({where:{email:user.email}})
          if(!googleUser){
            const newUser=await prisma.user.create({
              data:{
                name:user.name,
                email:user.email,
                image:user.image
              }
            })
            return {...token , userId:newUser.id}
          }

          if(googleUser){
            return {...token,userId:googleUser.id}
          }
        }

      }
      else if(user){
        return {...token,userId:user.userId }

      }
      
      return token
    },
    async session({ session, token }) {
      session.user.userId=token.userId;

      return session
    }
  }
});


// const handler=NextAuth(authOptions)

export {handler as GET, handler as POST,handler as auth}
